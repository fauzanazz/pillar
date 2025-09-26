"""Command Line Interface for Contract Management System."""

import asyncio
import json
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich import print as rprint

from app.models.workflow import (
    UserRole, ContractTemplate, ContractParty, ContractStatus,
    ClauseStatus, CreateContractRequest
)
from app.services.workflow_service import workflow_service
from app.services.storage import contract_storage
from app.services.pdf_service import pdf_service

console = Console()


class CLISession:
    """CLI Session manager."""
    
    def __init__(self):
        self.current_role: Optional[UserRole] = None
        self.current_user = "CLI User"
    
    def set_role(self, role: UserRole):
        """Set current user role."""
        self.current_role = role
        console.print(f"[green]Switched to {role.value.upper()} role[/green]")


# Global CLI session
cli_session = CLISession()


def main():
    """Main interactive CLI loop."""
    console.print("[bold blue]Contract Management System[/bold blue]")
    console.print("Interactive Contract Management CLI")
    
    # Initial role selection
    if not cli_session.current_role:
        select_role_interactive()
    
    # Main interactive loop
    while True:
        try:
            show_main_menu()
            choice = Prompt.ask("\nSelect option", choices=get_menu_choices())
            
            if choice == "0" or choice == "exit":
                console.print("[yellow]Goodbye![/yellow]")
                break
            elif choice == "1":
                show_dashboard()
            elif choice == "2":
                create_contract_interactive()
            elif choice == "3":
                work_on_contract_interactive()
            elif choice == "4":
                select_role_interactive()
            elif choice == "5":
                show_stats()
            elif choice == "6":
                list_all_contracts()
            elif choice.startswith("work-"):
                contract_id = choice.split("-", 1)[1]
                work_on_contract_by_id(contract_id)
                
        except KeyboardInterrupt:
            console.print("\n[yellow]Use '0' or 'exit' to quit[/yellow]")
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")

def show_main_menu():
    """Show main menu based on current role."""
    role = cli_session.current_role
    if not role:
        console.print("[red]No role selected. Please select a role first.[/red]")
        return
        
    console.print(f"\n[bold]{role.value.upper()} Dashboard[/bold]")
    console.print("Available options:")
    console.print("1. Dashboard - View your contracts")
    console.print("2. Create Contract (Internal only)")
    console.print("3. Work on Contract")
    console.print("4. Switch Role")
    console.print("5. System Stats")
    console.print("6. List All Contracts")
    console.print("0. Exit")

def get_menu_choices():
    """Get valid menu choices."""
    choices = ["0", "1", "2", "3", "4", "5", "6", "exit"]
    # Add contract shortcuts from recent contracts
    contracts = workflow_service.get_contracts_for_role(cli_session.current_role) if cli_session.current_role else []
    for contract in contracts[:5]:  # Show first 5 contracts as shortcuts
        choices.append(f"work-{contract.id[:8]}")
    return choices


def select_role_interactive():
    """Select user role interactively."""
    console.print("\n[bold]Available Roles:[/bold]")
    console.print("1. Internal - Create contracts and handle rejections")
    console.print("2. Legal - Review clauses and add legal content")  
    console.print("3. Management - Approve or reject final contracts")
    
    choice = Prompt.ask("Select role", choices=["1", "2", "3"])
    
    role_map = {
        "1": UserRole.INTERNAL,
        "2": UserRole.LEGAL,
        "3": UserRole.MANAGEMENT
    }
    
    cli_session.set_role(role_map[choice])


def show_dashboard():
    """Show role-specific dashboard."""
    if not cli_session.current_role:
        console.print("[red]Please select a role first.[/red]")
        return
    
    role = cli_session.current_role
    
    # Get contracts for this role
    contracts = workflow_service.get_contracts_for_role(role)
    
    # Show dashboard
    console.print(f"\n[bold]{role.value.upper()} Dashboard[/bold]")
    
    if not contracts:
        console.print("[yellow]No contracts assigned to you.[/yellow]")
        if role == UserRole.INTERNAL:
            console.print("Use option 2 to create a new contract.")
        return
    
    # Create table
    table = Table(title=f"Your Contracts ({len(contracts)})")
    table.add_column("ID", style="cyan")
    table.add_column("Title", style="white")
    table.add_column("Status", style="yellow")
    table.add_column("Updated", style="green")
    table.add_column("Actions", style="blue")
    
    for contract in contracts:
        actions = workflow_service._get_available_actions(contract, role)
        table.add_row(
            contract.id[:8],
            contract.template.title[:30],
            contract.status.value,
            contract.updated_at.strftime("%Y-%m-%d %H:%M"),
            ", ".join(actions[:2])  # Show first 2 actions
        )
    
    console.print(table)
    
    # Show shortcuts
    console.print("\n[bold]Quick Access:[/bold]")
    for i, contract in enumerate(contracts[:5], 1):
        console.print(f"work-{contract.id[:8]} - Work on {contract.template.title[:30]}")
        
    Prompt.ask("Press Enter to continue", default="")


def create_contract_interactive():
    """Create new contract (Internal only)."""
    if cli_session.current_role != UserRole.INTERNAL:
        console.print("[red]Only Internal role can create contracts[/red]")
        Prompt.ask("Press Enter to continue", default="")
        return
    
    console.print("\n[bold]Create New Contract[/bold]")
    
    # Get contract details
    title = Prompt.ask("Contract Title")
    description = Prompt.ask("Contract Description")
    
    # Get parties
    parties = []
    party_count = int(Prompt.ask("Number of parties", default="2"))
    
    for i in range(party_count):
        console.print(f"\n[bold]Party {i+1} Details:[/bold]")
        role = Prompt.ask("Role (e.g., PIHAK PERTAMA)", default=f"PIHAK {['PERTAMA', 'KEDUA', 'KETIGA'][i]}")
        name = Prompt.ask("Company/Individual Name")
        rep = Prompt.ask("Representative Name", default="")
        address = Prompt.ask("Address")
        
        parties.append(ContractParty(
            role=role,
            name=name,
            rep=rep if rep else None,
            address=address
        ))
    
    # Get other details
    end_date = Prompt.ask("End Date (YYYY-MM-DD)", default=(datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"))
    jurisdiction = Prompt.ask("Jurisdiction", default="Indonesia")
    language = Prompt.ask("Language", default="Indonesian")
    
    value_str = Prompt.ask("Contract Value (optional)", default="")
    value = float(value_str) if value_str else None
    
    special_requirements = Prompt.ask("Special Requirements (optional)", default="")
    
    # Create template
    template = ContractTemplate(
        title=title,
        description=description,
        parties=parties,
        end_date=end_date,
        jurisdiction=jurisdiction,
        language=language,
        value=value,
        special_requirements=special_requirements if special_requirements else None
    )
    
    # Create contract
    contract = workflow_service.create_contract(template, UserRole.INTERNAL)
    
    console.print(f"\n[green]Contract created successfully![/green]")
    console.print(f"Contract ID: {contract.id}")
    console.print(f"Status: {contract.status.value}")
    console.print(f"Next: Legal team will generate clauses")
    
    Prompt.ask("Press Enter to continue", default="")


async def generate_clauses_for_contract(contract_id: str):
    """Generate clauses for contract."""
    try:
        console.print(f"\n[yellow]Generating clauses for contract {contract_id}...[/yellow]")
        contract = await workflow_service.generate_clauses(contract_id)
        
        console.print(f"[green]Generated {len(contract.clauses)} clauses![/green]")
        console.print(f"Status: {contract.status.value}")
        console.print("Contract is now ready for Legal review.")
        
    except Exception as e:
        console.print(f"[red]Error generating clauses: {e}[/red]")


def work_on_contract_interactive():
    """Work on specific contract - ask for contract ID."""
    if not cli_session.current_role:
        console.print("[red]Please select a role first[/red]")
        Prompt.ask("Press Enter to continue", default="")
        return
    
    # Show available contracts first
    contracts = workflow_service.get_contracts_for_role(cli_session.current_role)
    if not contracts:
        console.print("[yellow]No contracts available for your role[/yellow]")
        Prompt.ask("Press Enter to continue", default="")
        return
    
    console.print("\n[bold]Available Contracts:[/bold]")
    for i, contract in enumerate(contracts, 1):
        console.print(f"{i}. {contract.id[:8]} - {contract.template.title}")
    
    choice = Prompt.ask("Select contract number", choices=[str(i) for i in range(1, len(contracts) + 1)])
    selected_contract = contracts[int(choice) - 1]
    work_on_contract_by_id(selected_contract.id)

def work_on_contract_by_id(contract_id: str):
    """Work on specific contract by ID."""
    if not cli_session.current_role:
        console.print("[red]Please select a role first[/red]")
        Prompt.ask("Press Enter to continue", default="")
        return
    
    try:
        contract_data = workflow_service.get_contract_with_actions(contract_id, cli_session.current_role)
        contract = contract_data["contract"]
        actions = contract_data["actions_available"]
        
        # Show contract details
        console.print(f"\n[bold]Contract: {contract.template.title}[/bold]")
        console.print(f"ID: {contract.id}")
        console.print(f"Status: {contract.status.value}")
        console.print(f"Current Assignee: {contract.current_assignee.value}")
        console.print(f"Description: {contract.template.description}")
        
        # Show clauses if any
        if contract.clauses:
            console.print(f"\n[bold]Clauses ({len(contract.clauses)}):[/bold]")
            clause_table = Table()
            clause_table.add_column("No", style="cyan")
            clause_table.add_column("Title", style="white")
            clause_table.add_column("Status", style="yellow")
            clause_table.add_column("Notes", style="green")
            
            for clause in contract.clauses:
                clause_table.add_row(
                    str(clause.no),
                    clause.title[:40],
                    clause.status.value,
                    (clause.notes or "")[:30]
                )
            
            console.print(clause_table)
        
        # Show available actions
        console.print(f"\n[bold]Available Actions:[/bold]")
        for i, action in enumerate(actions, 1):
            console.print(f"{i}. {action}")
        
        # Handle actions based on role
        if cli_session.current_role == UserRole.INTERNAL:
            handle_internal_actions(contract, actions)
        elif cli_session.current_role == UserRole.LEGAL:
            handle_legal_actions(contract, actions)
        elif cli_session.current_role == UserRole.MANAGEMENT:
            handle_management_actions(contract, actions)
        
        Prompt.ask("Press Enter to continue", default="")
        
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        Prompt.ask("Press Enter to continue", default="")


def handle_internal_actions(contract, actions):
    """Handle internal role actions."""
    if "generate_clauses" in actions:
        if Confirm.ask("Generate AI clauses?"):
            asyncio.run(generate_clauses_for_contract(contract.id))
    
    elif "edit_template" in actions:
        console.print("[yellow]Template editing not implemented in CLI yet[/yellow]")
        console.print("Use the web interface for template editing")


def handle_legal_actions(contract, actions):
    """Handle legal role actions."""
    if "generate_clauses" in actions:
        if Confirm.ask("Generate AI clauses?"):
            asyncio.run(generate_clauses_for_contract(contract.id))
            return
    
    if "review_clauses" in actions:
        if Confirm.ask("Review clauses?"):
            review_clauses_interactive(contract.id)
    
    if "add_clause" in actions:
        if Confirm.ask("Add manual clause?"):
            add_clause_interactive(contract.id)
    
    if "regenerate_clauses" in actions:
        if Confirm.ask("Regenerate AI clauses?"):
            asyncio.run(generate_clauses_for_contract(contract.id))
            return
    
    if "submit_to_management" in actions:
        if Confirm.ask("Submit to management?"):
            submit_to_management_interactive(contract.id)


def handle_management_actions(contract, actions):
    """Handle management role actions."""
    if any(action.startswith("approve") or action.startswith("reject") for action in actions):
        make_management_decision_interactive(contract.id)


def review_clauses_interactive(contract_id: str):
    """Interactive clause review."""
    contract = workflow_service.storage.load_contract(contract_id)
    pending_clauses = [c for c in contract.clauses if c.status == ClauseStatus.PENDING]
    
    if not pending_clauses:
        console.print("[green]All clauses have been reviewed![/green]")
        return
    
    for clause in pending_clauses:
        console.print(f"\n[bold]Clause {clause.no}: {clause.title}[/bold]")
        console.print(f"Text: {clause.text}")
        console.print(f"Notes: {clause.notes or 'None'}")
        
        decision = Prompt.ask(
            "Decision", 
            choices=["accept", "reject", "edit", "skip"],
            default="accept"
        )
        
        if decision == "skip":
            continue
        elif decision == "edit":
            new_text = Prompt.ask("New text", default=clause.text)
            notes = Prompt.ask("Review notes", default="")
            workflow_service.review_clause(
                contract_id, clause.id, ClauseStatus.EDITED, 
                edited_text=new_text, notes=notes
            )
        else:
            status = ClauseStatus.ACCEPTED if decision == "accept" else ClauseStatus.REJECTED
            notes = Prompt.ask("Review notes", default="")
            workflow_service.review_clause(
                contract_id, clause.id, status, notes=notes
            )
        
        console.print(f"[green]Clause {clause.no} {decision}ed[/green]")


def add_clause_interactive(contract_id: str):
    """Interactive add clause."""
    no = int(Prompt.ask("Clause number"))
    title = Prompt.ask("Clause title")
    text = Prompt.ask("Clause text")
    notes = Prompt.ask("Notes", default="")
    
    workflow_service.add_manual_clause(contract_id, no, title, text, notes)
    console.print("[green]Clause added successfully![/green]")


def submit_to_management_interactive(contract_id: str):
    """Interactive submit to management."""
    notes = Prompt.ask("Submission notes", default="")
    
    try:
        contract = workflow_service.submit_to_management(contract_id, notes=notes)
        console.print("[green]Contract submitted to management![/green]")
        console.print(f"Status: {contract.status.value}")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


def make_management_decision_interactive(contract_id: str):
    """Interactive management decision."""
    console.print("\n[bold]Management Decision[/bold]")
    console.print("1. Approve")
    console.print("2. Reject to Legal")
    console.print("3. Reject to Internal")  
    console.print("4. Reject to Both")
    
    choice = Prompt.ask("Decision", choices=["1", "2", "3", "4"])
    
    decision_map = {
        "1": "approve",
        "2": "reject_to_legal", 
        "3": "reject_to_internal",
        "4": "reject_to_both"
    }
    
    decision = decision_map[choice]
    notes = Prompt.ask("Decision notes", default="")
    
    try:
        contract = workflow_service.management_decision(contract_id, decision, notes)
        console.print(f"[green]Decision recorded: {decision}[/green]")
        console.print(f"Status: {contract.status.value}")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")




def show_stats():
    """Show system statistics."""
    stats = contract_storage.get_stats()
    
    console.print("\n[bold]System Statistics[/bold]")
    console.print(f"Total Contracts: {stats['total_contracts']}")
    
    if stats['by_status']:
        console.print("\n[bold]By Status:[/bold]")
        for status, count in stats['by_status'].items():
            console.print(f"  {status}: {count}")
    
    if stats['by_assignee']:
        console.print("\n[bold]By Current Assignee:[/bold]")
        for assignee, count in stats['by_assignee'].items():
            console.print(f"  {assignee}: {count}")
    
    Prompt.ask("Press Enter to continue", default="")


def list_all_contracts():
    """List all contracts (admin view)."""
    contracts = contract_storage.list_contracts()
    
    if not contracts:
        console.print("[yellow]No contracts found[/yellow]")
        Prompt.ask("Press Enter to continue", default="")
        return
    
    table = Table(title=f"All Contracts ({len(contracts)})")
    table.add_column("ID", style="cyan")
    table.add_column("Title", style="white") 
    table.add_column("Status", style="yellow")
    table.add_column("Assignee", style="green")
    table.add_column("Updated", style="blue")
    
    for contract in contracts:
        table.add_row(
            contract.id[:8],
            contract.template.title[:30],
            contract.status.value,
            contract.current_assignee.value,
            contract.updated_at.strftime("%Y-%m-%d %H:%M")
        )
    
    console.print(table)
    Prompt.ask("Press Enter to continue", default="")


if __name__ == "__main__":
    main()