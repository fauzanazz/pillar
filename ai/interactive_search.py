#!/usr/bin/env python3
"""Interactive chatbot-style search interface."""

import asyncio
import os
import sys
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt
from rich.text import Text
from rich.live import Live
from rich import print as rprint

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.search_service import search_service
from app.services.storage import contract_storage

console = Console()

def show_welcome():
    """Show welcome message."""
    welcome_text = """
Smart Contract Search Assistant

Ask me about contracts in natural language! 

Example queries:
* "Show me all contracts with ASUS"
* "Find contracts expiring in the next 30 days"  
* "Which contracts are still pending approval?"
* "Show high value contracts"
* "Find contracts with penalty clauses"

Type 'help' for more examples or 'quit' to exit.
    """
    
    panel = Panel(
        welcome_text.strip(),
        title="[bold blue]Contract Search AI[/bold blue]",
        border_style="blue"
    )
    console.print(panel)

def show_help():
    """Show help with query examples."""
    help_text = """
SEARCH EXAMPLES:

Party/Company Search:
* "contracts with Microsoft"
* "show all vendor agreements with PT Telkom" 
* "find contracts involving ASUS"

Status Search:
* "approved contracts"
* "draft contracts pending review"
* "contracts under legal review"

Date Search:
* "contracts expiring in 30 days"
* "contracts created last month"
* "agreements ending this year"

Value Search:
* "contracts worth over 1 billion"
* "high value agreements"
* "contracts with payment terms"

Content Search:
* "contracts with penalty clauses"
* "find confidentiality agreements"
* "contracts with termination clauses"
* "agreements with liability limits"

General Search:
* "all contracts"
* "recent contracts"
* "software licensing agreements"

TIP: You can combine criteria like "approved contracts with ASUS expiring soon"
    """
    
    panel = Panel(
        help_text.strip(),
        title="[bold green]Search Help[/bold green]",
        border_style="green"
    )
    console.print(panel)

async def process_search(query: str):
    """Process search query and display results."""
    
    # Show thinking indicator
    with console.status(f"[bold green]Analyzing query: '{query}'...", spinner="dots"):
        try:
            result = await search_service.search(query)
        except Exception as e:
            console.print(f"[red]Search failed: {e}[/red]")
            return
    
    # Show query understanding
    intent_panel = Panel(
        f"Intent: {result.query.intent.value.replace('_', ' ').title()}\n"
        f"Confidence: {result.query.confidence:.1%}\n"
        f"Understanding: {result.query.explanation}\n"
        f"Processing time: {result.processing_time_ms}ms",
        title="[cyan]Query Analysis[/cyan]",
        border_style="cyan"
    )
    console.print(intent_panel)
    
    # Show results
    if result.matches:
        console.print(f"\n[bold green]Found {result.total_found} matching contracts:[/bold green]")
        
        # Create results table
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Contract ID", style="cyan", width=20)
        table.add_column("Title", style="white", width=40)
        table.add_column("Status", style="green", width=15)
        table.add_column("Score", style="yellow", width=8)
        table.add_column("Match Reasons", style="blue")
        
        for i, match in enumerate(result.matches[:10]):  # Show top 10
            contract = match.contract
            
            # Truncate long titles
            title = contract.template.title
            if len(title) > 37:
                title = title[:37] + "..."
            
            # Show main reasons
            reasons = ", ".join(match.match_reasons[:2])
            if len(reasons) > 50:
                reasons = reasons[:50] + "..."
            
            table.add_row(
                contract.id[:18] + "...",
                title,
                contract.status.value.replace('_', ' ').title(),
                f"{match.score:.3f}",
                reasons
            )
        
        console.print(table)
        
        # Show first result details
        if result.matches:
            first_match = result.matches[0]
            contract = first_match.contract
            
            details_text = f"""
Title: {contract.template.title}
Created: {contract.created_at.strftime('%Y-%m-%d %H:%M')}
Parties: {', '.join([p.name for p in contract.template.parties])}
Value: {f'Rp {contract.template.value:,.0f}' if hasattr(contract.template, 'value') and contract.template.value else 'Not specified'}
Match Score: {first_match.score:.3f}
            """.strip()
            
            if first_match.highlights:
                details_text += "\n\nHighlights:"
                for category, items in first_match.highlights.items():
                    details_text += f"\n  * {category.title()}: {', '.join(items[:3])}"
            
            details_panel = Panel(
                details_text,
                title=f"[bold yellow]Top Result Details[/bold yellow]",
                border_style="yellow"
            )
            console.print(details_panel)
    
    else:
        console.print(f"[yellow]No contracts found matching '{query}'[/yellow]")
        
        if result.suggestions:
            suggestions_text = "\n".join([f"* {suggestion}" for suggestion in result.suggestions])
            suggestions_panel = Panel(
                suggestions_text,
                title="[blue]Suggestions[/blue]",
                border_style="blue"
            )
            console.print(suggestions_panel)

def show_stats():
    """Show contract statistics."""
    contracts = contract_storage.list_contracts()
    
    # Count by status
    status_counts = {}
    for contract in contracts:
        status = contract.status.value
        status_counts[status] = status_counts.get(status, 0) + 1
    
    stats_text = f"Total Contracts: {len(contracts)}\n\n"
    stats_text += "Status Breakdown:\n"
    for status, count in status_counts.items():
        stats_text += f"  * {status.replace('_', ' ').title()}: {count}\n"
    
    stats_panel = Panel(
        stats_text.strip(),
        title="[bold magenta]Contract Database Stats[/bold magenta]",
        border_style="magenta"
    )
    console.print(stats_panel)

async def main():
    """Main interactive loop."""
    
    # Check if we have contracts
    contracts = contract_storage.list_contracts()
    if len(contracts) == 0:
        console.print("[red]No contracts found in database! Please create some contracts first.[/red]")
        return
    
    show_welcome()
    show_stats()
    
    console.print("\n" + "="*60)
    console.print("[bold]Ready to search! Type your query below:[/bold]\n")
    
    while True:
        try:
            # Get user input
            query = Prompt.ask(
                "[bold blue]Search",
                default="",
                show_default=False
            ).strip()
            
            if not query:
                continue
            
            # Handle special commands
            if query.lower() in ['quit', 'exit', 'q', 'bye']:
                console.print("[yellow]Goodbye! Thanks for using Contract Search AI![/yellow]")
                break
            elif query.lower() in ['help', 'h', '?']:
                show_help()
                continue
            elif query.lower() in ['stats', 'status', 'info']:
                show_stats()
                continue
            elif query.lower() == 'clear':
                console.clear()
                show_welcome()
                continue
            
            # Process search
            console.print()  # Add spacing
            await process_search(query)
            console.print("\n" + "-"*60 + "\n")
            
        except KeyboardInterrupt:
            console.print("\n[yellow]Use 'quit' to exit gracefully[/yellow]")
        except Exception as e:
            console.print(f"[red]Unexpected error: {e}[/red]")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Goodbye![/yellow]")