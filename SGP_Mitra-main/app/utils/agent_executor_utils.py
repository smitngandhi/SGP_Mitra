from app.utils.tools_utils import *
from app.utils.prompt_utils import *
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
from langchain.agents import initialize_agent, AgentType
from app.models import llm

load_dotenv()


agent = initialize_agent(
    tools=mitra_tools,
    llm=llm,  # whichever LLM you are using (HuggingFace, Gemini, etc.)
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,  # or CONVERSATIONAL_REACT_DESCRIPTION if chatty
    verbose=True,
    handle_parsing_errors=True,
    agent_kwargs={
        "system_message": (
            "When answering, format the output clearly:\n"
            "- Use numbered or bulleted points when listing.\n"
            "- Use short sections with headings if needed.\n"
            "- Keep responses concise but structured."
        )
    }
)