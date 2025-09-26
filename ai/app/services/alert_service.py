"""
Service for creating and managing alerts based on risk identification results.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.database import get_supabase_client

logger = logging.getLogger(__name__)


class AlertService:
    """Service for managing alerts based on risk identification."""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    async def create_alerts_from_risks(self, contract_id: str, risks: List[Dict[str, Any]], 
                                     created_by: str = "risk_scanner") -> List[Dict[str, Any]]:
        """
        Create alerts for each identified risk.
        
        Args:
            contract_id: ID of the contract
            risks: List of risk dictionaries from risk identification service
            created_by: Who created the alerts (defaults to "risk_scanner")
            
        Returns:
            List of created alert records
        """
        created_alerts = []
        
        try:
            # Convert string contract_id to integer if needed
            try:
                numeric_contract_id = int(contract_id)
            except ValueError:
                logger.error(f"Invalid contract ID format: {contract_id}")
                return []
            
            for risk in risks:
                alert_data = self._risk_to_alert(risk, numeric_contract_id, created_by)
                
                try:
                    response = self.client.table('alerts').insert(alert_data).execute()
                    if response.data:
                        created_alerts.extend(response.data)
                        alert_record = response.data[0]
                        logger.info(f"Created alert for risk: {risk.get('risk_type', 'unknown')}")
                        
                        # Publish alert to RabbitMQ
                        await self._publish_alert_to_rabbitmq(alert_record, risk, contract_id)
                        
                except Exception as e:
                    logger.error(f"Failed to create alert for risk {risk.get('risk_type')}: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to create alerts for contract {contract_id}: {e}")
            
        return created_alerts
    
    def _risk_to_alert(self, risk: Dict[str, Any], contract_id: int, created_by: str) -> Dict[str, Any]:
        """
        Convert a risk dictionary to an alert record.
        
        Args:
            risk: Risk data from risk identification service
            contract_id: Numeric contract ID
            created_by: Who created the alert
            
        Returns:
            Alert data ready for database insertion
        """
        # Map risk levels to alert priorities
        risk_level_to_priority = {
            'critical': 'high',
            'high': 'high', 
            'medium': 'medium',
            'low': 'low'
        }
        
        # Build alert message
        risk_type = risk.get('risk_type', 'unknown_risk')
        description = risk.get('description', 'No description available')
        recommendation = risk.get('recommendation', '')
        
        message = f"Risk Identified: {description}"
        if recommendation:
            message += f" | Recommendation: {recommendation}"
        
        # Add deadline info if available
        if risk.get('deadline'):
            message += f" | Deadline: {risk['deadline']}"
        
        # Add clause reference if available
        if risk.get('clause_reference'):
            message += f" | Clause: {risk['clause_reference'][:100]}..."
        
        priority = risk_level_to_priority.get(risk.get('risk_level', 'low'), 'low')
        
        return {
            'contract_id': contract_id,
            'message': message,
            'priority': priority,
            'is_read': False,
            'created_by': created_by,
            'created_at': datetime.now().isoformat()
        }
    
    async def get_contract_alerts(self, contract_id: str, unread_only: bool = False) -> List[Dict[str, Any]]:
        """
        Get all alerts for a specific contract.
        
        Args:
            contract_id: Contract ID
            unread_only: If True, only return unread alerts
            
        Returns:
            List of alert records
        """
        try:
            numeric_contract_id = int(contract_id)
            query = self.client.table('alerts').select('*').eq('contract_id', numeric_contract_id)
            
            if unread_only:
                query = query.eq('is_read', False)
            
            query = query.order('created_at', desc=True)
            response = query.execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"Failed to get alerts for contract {contract_id}: {e}")
            return []
    
    async def mark_alert_read(self, alert_id: int) -> bool:
        """
        Mark an alert as read.
        
        Args:
            alert_id: ID of the alert to mark as read
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.client.table('alerts').update({'is_read': True}).eq('id', alert_id).execute()
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Failed to mark alert {alert_id} as read: {e}")
            return False
    
    async def get_alert_summary(self, contract_id: str) -> Dict[str, int]:
        """
        Get alert summary for a contract.
        
        Args:
            contract_id: Contract ID
            
        Returns:
            Dictionary with alert counts by priority and read status
        """
        try:
            alerts = await self.get_contract_alerts(contract_id)
            
            summary = {
                'total': len(alerts),
                'unread': len([a for a in alerts if not a.get('is_read', False)]),
                'high_priority': len([a for a in alerts if a.get('priority') == 'high']),
                'medium_priority': len([a for a in alerts if a.get('priority') == 'medium']),
                'low_priority': len([a for a in alerts if a.get('priority') == 'low'])
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get alert summary for contract {contract_id}: {e}")
            return {
                'total': 0,
                'unread': 0,
                'high_priority': 0,
                'medium_priority': 0,
                'low_priority': 0
            }
    
    async def _publish_alert_to_rabbitmq(self, alert_record: Dict[str, Any], risk_data: Dict[str, Any], contract_id: str):
        """
        Publish alert to RabbitMQ.
        
        Args:
            alert_record: The alert record from database
            risk_data: Original risk data from risk identification
            contract_id: Contract ID
        """
        try:
            # Import here to avoid circular imports
            import asyncio
            from app.services.rabbitmq_publisher import get_rabbitmq_publisher
            
            # Map risk level to severity
            risk_level_to_severity = {
                'critical': 'CRITICAL',
                'high': 'HIGH',
                'medium': 'MEDIUM',
                'low': 'LOW'
            }
            
            # Extract alert data
            alert_id = alert_record.get('id')
            risk_type = risk_data.get('risk_type', 'unknown_risk')
            severity = risk_level_to_severity.get(risk_data.get('risk_level', 'low'), 'LOW')
            
            # Prepare facts
            facts = {
                'risk_score': risk_data.get('risk_score', 0),
                'risk_level': risk_data.get('risk_level', 'low'),
                'risk_type': risk_type,
                'deadline': risk_data.get('deadline'),
                'clause_reference': risk_data.get('clause_reference')
            }
            
            # Prepare rendered message
            rendered_message = {
                'subject': f"Risk Alert: {risk_data.get('description', 'Unknown risk identified')}",
                'body_text': alert_record.get('message', '')
            }
            
            # Run RabbitMQ publish in thread pool since pika is synchronous
            loop = asyncio.get_event_loop()
            
            def publish_with_new_instance():
                publisher = get_rabbitmq_publisher()
                return publisher.publish_ai_alert(
                    alert_id=alert_id,
                    contract_id=contract_id,
                    alert_type=risk_type,
                    severity=severity,
                    facts=facts,
                    rendered_message=rendered_message
                )
                
            success = await loop.run_in_executor(None, publish_with_new_instance)
            
            if success:
                logger.info(f"Successfully published alert {alert_id} to RabbitMQ")
            else:
                logger.warning(f"Failed to publish alert {alert_id} to RabbitMQ")
                
        except Exception as e:
            logger.error(f"Error publishing alert to RabbitMQ: {e}")
            # Don't re-raise - we don't want RabbitMQ issues to break alert creation


# Global service instance
alert_service = AlertService()