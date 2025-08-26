from app.utils.tools_utils import *
from app.utils.prompt_utils import *
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
from langchain.agents import initialize_agent, AgentType

load_dotenv()

llm = ChatOpenAI(
    model="lgai/exaone-3-5-32b-instruct",
    api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature = 0.001
)

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


# if __name__ == "__main__":
#     print("SGP Mitra Assistant initialized successfully!")
#     print("=" * 60)
    
#     # Test questions
#     test_questions = [
#         "What is Mitra?",
#         "Who is Mitra?", 
#         "How do I use the voice chat feature?",
#         "What are the main API endpoints?",
#         "How do I deploy Mitra locally?",
#         "What mental health assessments are available?"
#     ]
    
#     for i, question in enumerate(test_questions, 1):
#         print(f"\n{i}. Testing Question: {question}")
#         print("-" * 40)
        
#         # Test with standard agent
#         answer = agent.invoke({"input": question})
#         print(f"Answer: {answer}")
#         print("-" * 40)
