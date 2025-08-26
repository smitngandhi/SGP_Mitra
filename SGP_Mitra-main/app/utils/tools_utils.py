from langchain.tools import Tool
from app.utils.embeddings_utils import *
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)
logger.debug("[DEBUG] Initializing retrievers and LangChain Tools for  Mitra")


try:
    # Create retrievers
    api_docs_retriever = api_docs_vectorstore.as_retriever(search_kwargs={"k": 2})
    architecture_retriever = architecture_vectorstore.as_retriever(search_kwargs={"k": 2})
    deployment_retriever = deployment_vectorstore.as_retriever(search_kwargs={"k": 2})
    developer_guide_retriever = developer_guide_vectorstore.as_retriever(search_kwargs={"k": 2})
    mitra_overview_retriever = mitra_overview_vectorstore.as_retriever(search_kwargs={"k": 2})
    user_guide_retriever = user_guide_vectorstore.as_retriever(search_kwargs={"k": 2})

    logger.info("[INFO] All retrievers initialized successfully")

except Exception as e:
    logger.error(f"[ERROR] Failed to initialize retrievers: {str(e)}", exc_info=True)
    raise

try:

    # API Documentation Tool
    api_docs_tool = Tool(
        name="MitraAPIDocumentation",
        func=lambda q: "\n\n".join([doc.page_content for doc in api_docs_retriever.invoke(q)]),
        description="Comprehensive API reference for  Mitra platform. Use for questions about: REST endpoints and HTTP methods, authentication (JWT tokens, OAuth), request/response formats and JSON schemas, chatbot API endpoints, voice chat functionality, assessment submission and retrieval, user management operations, emergency support APIs, music therapy endpoints, error codes and status codes, rate limiting policies, webhook configurations, SDK examples in JavaScript and Python. Essential for developers integrating with or building on the  Mitra platform."
    )

    # System Architecture Tool  
    architecture_tool = Tool(
        name="MitraArchitecture",
        func=lambda q: "\n\n".join([doc.page_content for doc in architecture_retriever.invoke(q)]),
        description="Technical system architecture and design patterns for  Mitra. Use for questions about: microservices architecture and system design, technology stack (Flask, React, MongoDB, AI services), data flow and request processing pipelines, security architecture and authentication flows, AI/ML integration patterns, database schema and collections structure, scalability considerations and performance optimization, directory structure and code organization, monitoring and observability setup, configuration management. Critical for understanding how  Mitra is built and architected."
    )

    # Deployment Guide Tool
    deployment_tool = Tool(
        name="MitraDeployment", 
        func=lambda q: "\n\n".join([doc.page_content for doc in deployment_retriever.invoke(q)]),
        description="Complete deployment guide for  Mitra across different environments. Use for questions about: local development setup and configuration, Docker containerization and orchestration, cloud deployment on AWS/GCP/Azure/Heroku, production environment configuration, database deployment (MongoDB Atlas, self-hosted), SSL/TLS certificate setup, security hardening and firewall configuration, CI/CD pipeline setup with GitHub Actions, monitoring and logging implementation, backup and disaster recovery strategies, troubleshooting common deployment issues, scaling considerations and load balancing."
    )

    # Developer Guide Tool
    developer_guide_tool = Tool(
        name="MitraDeveloperGuide",
        func=lambda q: "\n\n".join([doc.page_content for doc in developer_guide_retriever.invoke(q)]),
        description="Developer-focused implementation guide for  Mitra. Use for questions about: development workflow and setup procedures, Flask backend development patterns, React frontend component structure, database operations and MongoDB queries, AI service integration (LLMs, voice processing), authentication implementation with JWT, security best practices and input validation, testing strategies (unit, integration, e2e), code style guidelines and standards, debugging techniques and tools, performance optimization strategies, contribution guidelines and pull request process. Essential for developers working on the codebase."
    )

    # Platform Overview Tool
    platform_overview_tool = Tool(
        name="MitraPlatformOverview",
        func=lambda q: "\n\n".join([doc.page_content for doc in mitra_overview_retriever.invoke(q)]),
        description="Comprehensive overview of  Mitra platform features and capabilities. Use for questions about: platform mission and core philosophy, complete feature set and functionality, AI-powered chatbot capabilities, voice interaction system, mental health assessments (PHQ-9, GAD-7), AI-generated music therapy, self-care activities and tools, emergency crisis support features, progress tracking and analytics, technical implementation details, team information and project background, getting started instructions and setup. Perfect for understanding what  Mitra is and what it can do."
    )

    # User Guide Tool
    user_guide_tool = Tool(
        name="MitraUserGuide",
        func=lambda q: "\n\n".join([doc.page_content for doc in user_guide_retriever.invoke(q)]),
        description="End-user guide for navigating and using  Mitra platform effectively. Use for questions about: account creation and registration process, how to chat with Mitra AI assistant, voice interaction features and usage, taking mental health assessments and understanding results, accessing self-care activities and recommendations, using music therapy features, emergency support and crisis resources, tracking progress and viewing analytics, privacy settings and data protection, platform navigation and dashboard overview, communication tips for better AI interaction, when to seek professional mental health support. Ideal for user experience and platform usage questions."
    )



    # Combined tools list
    mitra_tools = [
        api_docs_tool,
        architecture_tool, 
        deployment_tool,
        developer_guide_tool,
        platform_overview_tool,
        user_guide_tool
    ]

    logger.info("[INFO] All LangChain Tools initialized successfully")

except Exception as e:
    logger.error(f"[ERROR] Failed to initialize one or more tools: {str(e)}", exc_info=True)
    raise