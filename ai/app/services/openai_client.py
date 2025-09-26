import json
import logging
from typing import Dict, Any, Optional
from openai import OpenAI
from app.settings import settings

logger = logging.getLogger(__name__)


class OpenAIClient:
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
    
    async def responses_create(
        self,
        system: str,
        user_json: Dict[str, Any],
        json_schema: Dict[str, Any],
        model: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a structured response using OpenAI's Responses API.
        
        Args:
            system: System prompt
            user_json: User message as JSON dict
            json_schema: JSON schema for structured output
            model: Model name (defaults to settings.openai_model)
            correlation_id: Request correlation ID for logging
            
        Returns:
            Parsed JSON response from OpenAI
            
        Raises:
            Exception: If OpenAI call fails or schema validation fails
        """
        try:
            model_name = model or settings.openai_model
            user_message = json.dumps(user_json, ensure_ascii=False)
            
            logger.info(
                "Making OpenAI request",
                extra={
                    "correlation_id": correlation_id,
                    "model": model_name,
                    "schema_name": json_schema.get("name", "unknown")
                }
            )
            
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_message}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": json_schema
                }
            )
            
            if hasattr(response.choices[0].message, 'parsed') and response.choices[0].message.parsed:
                result = response.choices[0].message.parsed
                if hasattr(result, 'model_dump'):
                    result = result.model_dump()
                elif hasattr(result, 'dict'):
                    result = result.dict()
            else:
                content = response.choices[0].message.content
                if not content:
                    raise ValueError("Empty response from OpenAI")
                result = json.loads(content)
            
            logger.info(
                "OpenAI request completed successfully",
                extra={
                    "correlation_id": correlation_id,
                    "usage": response.usage.model_dump() if response.usage else None
                }
            )
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(
                "Failed to parse OpenAI response as JSON",
                extra={"correlation_id": correlation_id, "error": str(e)}
            )
            raise ValueError(f"Invalid JSON response from OpenAI: {str(e)}")
            
        except Exception as e:
            logger.error(
                "OpenAI request failed",
                extra={"correlation_id": correlation_id, "error": str(e)}
            )
            raise


# Global client instance
openai_client = OpenAIClient()