"""
Internal client for Guardrails AI
(Private module - not exported)
"""

class GuardrailsClient:
    """Internal client for Guardrails AI API"""

    def __init__(self, api_key=None):
        self.api_key = api_key
        self.base_url = "https://api.guardrailsai.com"

    async def make_request(self, endpoint, data):
        """Make API request to Guardrails"""
        # Implementation placeholder
        pass