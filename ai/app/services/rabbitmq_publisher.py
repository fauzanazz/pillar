"""
RabbitMQ publisher service for AI-generated alerts.
Publishes alert events to match the backend's RabbitMQ schema.
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import uuid4

import pika
from pika.adapters.blocking_connection import BlockingChannel

from app.settings import settings

logger = logging.getLogger(__name__)


class RabbitMQPublisher:
    """Publisher for AI alert events to RabbitMQ."""
    
    # Constants matching backend configuration
    EXCHANGES = {
        'ALERTS': 'alerts.x',
        'DEAD': 'dead.x'
    }
    
    ROUTING_KEYS = {
        'ALERTS_AI_RISK_IDENTIFIED': 'alert.ai.risk.identified',  # New routing key for AI-generated alerts
        'ALERTS_CONTRACT_EXPIRING': 'contract.expiring',
        'ALERTS_CONTRACT_CLAUSE_MISSING': 'contract.clause.missing',
        'ALERTS_CONTRACT_ANOMALY': 'contract.anomaly'
    }
    
    QUEUES = {
        'ALERTS_EVENTS': 'alerts.events.q'
    }
    
    def __init__(self):
        self.connection = None
        self.channel = None
        # Temporarily hardcode for testing
        self.rabbitmq_url = "amqp://admin:nm05kd1r@168.110.223.202:32768/"
        
    def connect(self) -> bool:
        """Establish connection to RabbitMQ."""
        try:
            if self.connection and not self.connection.is_closed:
                return True
                
            logger.info(f"Connecting to RabbitMQ: {self.rabbitmq_url}")
            parameters = pika.URLParameters(self.rabbitmq_url)
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare exchanges (idempotent)
            self.channel.exchange_declare(
                exchange=self.EXCHANGES['ALERTS'],
                exchange_type='topic',
                durable=True
            )
            
            logger.info("Successfully connected to RabbitMQ")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            return False
    
    def disconnect(self):
        """Close RabbitMQ connection."""
        try:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                logger.info("Disconnected from RabbitMQ")
        except Exception as e:
            logger.error(f"Error disconnecting from RabbitMQ: {e}")
    
    def _create_envelope(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Create message envelope with metadata."""
        return {
            "message": message,
            "metadata": {
                "published_at": datetime.now().isoformat(),
                "publisher": "ifest-ai-service",
                "environment": os.getenv("ENVIRONMENT", "development"),
                "trace_id": str(uuid4())
            }
        }
    
    def publish_ai_alert(
        self,
        alert_id: int,
        contract_id: str,
        alert_type: str,  # e.g., 'risk_identified', 'deadline_expiry', etc.
        severity: str,    # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        facts: Dict[str, Any],
        rendered_message: Dict[str, str],
        correlation_id: Optional[str] = None
    ) -> bool:
        """
        Publish an AI-generated alert event.
        
        Args:
            alert_id: Database ID of the alert
            contract_id: ID of the contract the alert is for
            alert_type: Type of alert (risk_identified, deadline_expiry, etc.)
            severity: Alert severity level
            facts: Additional facts about the alert
            rendered_message: Human-readable alert message
            correlation_id: Optional correlation ID for tracing
            
        Returns:
            True if published successfully, False otherwise
        """
        if not self.connect():
            return False
            
        try:
            # Create alert event matching backend schema
            alert_event = {
                "alert_id": str(alert_id),
                "type": f"ai.{alert_type}",  # Prefix with 'ai.' to distinguish from other alerts
                "severity": severity.upper(),
                "aggregate_id": str(contract_id),
                "facts": {
                    **facts,
                    "ai_generated": True,
                    "source": "risk_scanner"
                },
                "rendered": {
                    "subject": rendered_message.get("subject", f"AI Alert: {alert_type}"),
                    "body_text": rendered_message.get("body_text", "")
                },
                "source": {
                    "job_id": correlation_id or str(uuid4()),
                    "agent_version": "ai-service-v1.0.0"
                },
                "occurred_at": datetime.now().isoformat()
            }
            
            # Create envelope
            envelope = self._create_envelope(alert_event)
            
            # Publish message
            message_body = json.dumps(envelope)
            properties = pika.BasicProperties(
                message_id=str(alert_id),
                correlation_id=correlation_id,
                timestamp=int(datetime.now().timestamp()),
                headers={
                    'alert_type': f"ai.{alert_type}",
                    'severity': severity.upper(),
                    'contract_id': str(contract_id),
                    'alert_id': str(alert_id)
                },
                delivery_mode=2  # Persistent
            )
            
            self.channel.basic_publish(
                exchange=self.EXCHANGES['ALERTS'],
                routing_key=self.ROUTING_KEYS['ALERTS_AI_RISK_IDENTIFIED'],
                body=message_body,
                properties=properties
            )
            
            logger.info(f"Published AI alert {alert_id} for contract {contract_id} with type {alert_type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to publish AI alert {alert_id}: {e}")
            return False
    
    def publish_batch_alerts(
        self,
        alerts: List[Dict[str, Any]],
        correlation_id: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Publish multiple AI alerts in batch.
        
        Args:
            alerts: List of alert dictionaries containing alert data
            correlation_id: Optional correlation ID for the batch
            
        Returns:
            Dictionary with success/failure counts
        """
        batch_correlation_id = correlation_id or str(uuid4())
        results = {"success": 0, "failed": 0}
        
        if not self.connect():
            results["failed"] = len(alerts)
            return results
        
        for alert in alerts:
            try:
                success = self.publish_ai_alert(
                    alert_id=alert["alert_id"],
                    contract_id=alert["contract_id"],
                    alert_type=alert["alert_type"],
                    severity=alert["severity"],
                    facts=alert.get("facts", {}),
                    rendered_message=alert.get("rendered_message", {}),
                    correlation_id=batch_correlation_id
                )
                
                if success:
                    results["success"] += 1
                else:
                    results["failed"] += 1
                    
            except Exception as e:
                logger.error(f"Failed to publish alert in batch: {e}")
                results["failed"] += 1
        
        logger.info(f"Batch alert publish completed: {results['success']} success, {results['failed']} failed")
        return results
    
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.disconnect()


# Helper function to get a new publisher instance
def get_rabbitmq_publisher() -> RabbitMQPublisher:
    """Get a new RabbitMQ publisher instance with current settings."""
    return RabbitMQPublisher()
