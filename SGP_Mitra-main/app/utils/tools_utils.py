from langchain.tools import Tool
from app.utils.embeddings_utils import *
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)
logger.debug("[DEBUG] Initializing retrievers and LangChain Tools for Mitra")

# Create retrievers for all available vectorstores
retrievers = {}

try:
    # Platform/Technical Documentation Retrievers
    if api_docs_vectorstore:
        retrievers['api_docs'] = api_docs_vectorstore.as_retriever(search_kwargs={"k": 3})
    if architecture_vectorstore:
        retrievers['architecture'] = architecture_vectorstore.as_retriever(search_kwargs={"k": 3})
    if deployment_vectorstore:
        retrievers['deployment'] = deployment_vectorstore.as_retriever(search_kwargs={"k": 3})
    if developer_guide_vectorstore:
        retrievers['developer_guide'] = developer_guide_vectorstore.as_retriever(search_kwargs={"k": 3})
    if mitra_overview_vectorstore:
        retrievers['mitra_overview'] = mitra_overview_vectorstore.as_retriever(search_kwargs={"k": 3})
    if readme_vectorstore:
        retrievers['readme'] = readme_vectorstore.as_retriever(search_kwargs={"k": 3})
    if user_guide_vectorstore:
        retrievers['user_guide'] = user_guide_vectorstore.as_retriever(search_kwargs={"k": 3})

    # Mental Health Condition Retrievers
    if anxiety_disorder_vectorstore:
        retrievers['anxiety_disorder'] = anxiety_disorder_vectorstore.as_retriever(search_kwargs={"k": 3})
    if adhd_vectorstore:
        retrievers['adhd'] = adhd_vectorstore.as_retriever(search_kwargs={"k": 3})
    if autism_vectorstore:
        retrievers['autism'] = autism_vectorstore.as_retriever(search_kwargs={"k": 3})
    if bipolar_disorder_vectorstore:
        retrievers['bipolar_disorder'] = bipolar_disorder_vectorstore.as_retriever(search_kwargs={"k": 3})
    if borderline_personality_vectorstore:
        retrievers['borderline_personality'] = borderline_personality_vectorstore.as_retriever(search_kwargs={"k": 3})
    if depression_vectorstore:
        retrievers['depression'] = depression_vectorstore.as_retriever(search_kwargs={"k": 3})
    if dmdd_vectorstore:
        retrievers['dmdd'] = dmdd_vectorstore.as_retriever(search_kwargs={"k": 3})
    if ocd_vectorstore:
        retrievers['ocd'] = ocd_vectorstore.as_retriever(search_kwargs={"k": 3})
    if panic_disorder_vectorstore:
        retrievers['panic_disorder'] = panic_disorder_vectorstore.as_retriever(search_kwargs={"k": 3})
    if ptsd_vectorstore:
        retrievers['ptsd'] = ptsd_vectorstore.as_retriever(search_kwargs={"k": 3})
    if psychosis_vectorstore:
        retrievers['psychosis'] = psychosis_vectorstore.as_retriever(search_kwargs={"k": 3})
    if schizophrenia_vectorstore:
        retrievers['schizophrenia'] = schizophrenia_vectorstore.as_retriever(search_kwargs={"k": 3})
    if sad_vectorstore:
        retrievers['sad'] = sad_vectorstore.as_retriever(search_kwargs={"k": 3})
    if social_anxiety_vectorstore:
        retrievers['social_anxiety'] = social_anxiety_vectorstore.as_retriever(search_kwargs={"k": 3})

    # General Mental Health Topics
    if brain_anatomy_vectorstore:
        retrievers['brain_anatomy'] = brain_anatomy_vectorstore.as_retriever(search_kwargs={"k": 3})
    if children_adolescents_vectorstore:
        retrievers['children_adolescents'] = children_adolescents_vectorstore.as_retriever(search_kwargs={"k": 3})
    if clinical_research_vectorstore:
        retrievers['clinical_research'] = clinical_research_vectorstore.as_retriever(search_kwargs={"k": 3})
    if general_articles_vectorstore:
        retrievers['general_articles'] = general_articles_vectorstore.as_retriever(search_kwargs={"k": 3})
    if genetics_vectorstore:
        retrievers['genetics'] = genetics_vectorstore.as_retriever(search_kwargs={"k": 3})
    if mens_mental_health_vectorstore:
        retrievers['mens_mental_health'] = mens_mental_health_vectorstore.as_retriever(search_kwargs={"k": 3})
    if prevention_vectorstore:
        retrievers['prevention'] = prevention_vectorstore.as_retriever(search_kwargs={"k": 3})
    if stress_vectorstore:
        retrievers['stress'] = stress_vectorstore.as_retriever(search_kwargs={"k": 3})
    if suicide_vectorstore:
        retrievers['suicide'] = suicide_vectorstore.as_retriever(search_kwargs={"k": 3})
    if traumatic_events_vectorstore:
        retrievers['traumatic_events'] = traumatic_events_vectorstore.as_retriever(search_kwargs={"k": 3})
    if treatments_vectorstore:
        retrievers['treatments'] = treatments_vectorstore.as_retriever(search_kwargs={"k": 3})
    if womens_mental_health_vectorstore:
        retrievers['womens_mental_health'] = womens_mental_health_vectorstore.as_retriever(search_kwargs={"k": 3})

    logger.info(f"[INFO] Successfully initialized {len(retrievers)} retrievers")

except Exception as e:
    logger.error(f"[ERROR] Failed to initialize retrievers: {str(e)}", exc_info=True)
    raise

# Create comprehensive tools for all available vectorstores
mitra_tools = []
chatbot_tools = []

try:
    # Platform/Technical Documentation Tools
    if 'api_docs' in retrievers:
        mitra_tools.append(Tool(
            name="MitraAPIDocumentation",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['api_docs'].invoke(q)]),
            description="Comprehensive API reference for Mitra platform. Use for questions about: REST endpoints and HTTP methods, authentication (JWT tokens, OAuth), request/response formats and JSON schemas, chatbot API endpoints, voice chat functionality, assessment submission and retrieval, user management operations, emergency support APIs, music therapy endpoints, error codes and status codes, rate limiting policies, webhook configurations, SDK examples in JavaScript and Python. Essential for developers integrating with or building on the Mitra platform."
        ))

    if 'architecture' in retrievers:
        mitra_tools.append(Tool(
            name="MitraArchitecture",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['architecture'].invoke(q)]),
            description="Technical system architecture and design patterns for Mitra. Use for questions about: microservices architecture and system design, technology stack (Flask, React, MongoDB, AI services), data flow and request processing pipelines, security architecture and authentication flows, AI/ML integration patterns, database schema and collections structure, scalability considerations and performance optimization, directory structure and code organization, monitoring and observability setup, configuration management."
        ))

    if 'deployment' in retrievers:
        mitra_tools.append(Tool(
            name="MitraDeployment",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['deployment'].invoke(q)]),
            description="Complete deployment guide for Mitra across different environments. Use for questions about: local development setup and configuration, Docker containerization and orchestration, cloud deployment on AWS/GCP/Azure/Heroku, production environment configuration, database deployment (MongoDB Atlas, self-hosted), SSL/TLS certificate setup, security hardening and firewall configuration, CI/CD pipeline setup with GitHub Actions, monitoring and logging implementation, backup and disaster recovery strategies."
        ))

    if 'developer_guide' in retrievers:
        mitra_tools.append(Tool(
            name="MitraDeveloperGuide",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['developer_guide'].invoke(q)]),
            description="Developer-focused implementation guide for Mitra. Use for questions about: development workflow and setup procedures, Flask backend development patterns, React frontend component structure, database operations and MongoDB queries, AI service integration (LLMs, voice processing), authentication implementation with JWT, security best practices and input validation, testing strategies (unit, integration, e2e), code style guidelines and standards, debugging techniques and tools."
        ))

    if 'mitra_overview' in retrievers:
        mitra_tools.append(Tool(
            name="MitraPlatformOverview",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['mitra_overview'].invoke(q)]),
            description="Comprehensive overview of Mitra platform features and capabilities. Use for questions about: platform mission and core philosophy, complete feature set and functionality, AI-powered chatbot capabilities, voice interaction system, mental health assessments (PHQ-9, GAD-7), AI-generated music therapy, self-care activities and tools, emergency crisis support features, progress tracking and analytics, technical implementation details, team information and project background."
        ))

    if 'user_guide' in retrievers:
        mitra_tools.append(Tool(
            name="MitraUserGuide",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['user_guide'].invoke(q)]),
            description="End-user guide for navigating and using Mitra platform effectively. Use for questions about: account creation and registration process, how to chat with Mitra AI assistant, voice interaction features and usage, taking mental health assessments and understanding results, accessing self-care activities and recommendations, using music therapy features, emergency support and crisis resources, tracking progress and viewing analytics, privacy settings and data protection."
        ))

    # Mental Health Condition Tools
    if 'anxiety_disorder' in retrievers:
        chatbot_tools.append(Tool(
            name="AnxietyDisorderGuide",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['anxiety_disorder'].invoke(q)]),
            description="Comprehensive information about anxiety disorders including Generalized Anxiety Disorder (GAD), panic disorder, phobias, and social anxiety. Use for questions about: anxiety symptoms and diagnosis, treatment options (therapy, medication), coping strategies, self-help techniques, when to seek professional help, understanding different types of anxiety disorders, managing anxiety in daily life, and supporting someone with anxiety."
        ))

    if 'adhd' in retrievers:
        chatbot_tools.append(Tool(
            name="ADHDInformation",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['adhd'].invoke(q)]),
            description="Detailed information about Attention-Deficit/Hyperactivity Disorder (ADHD). Use for questions about: ADHD symptoms in children and adults, diagnosis process, treatment options (medication, behavioral therapy), managing ADHD at school and work, coping strategies, family support, understanding different types of ADHD, and long-term management approaches."
        ))

    if 'depression' in retrievers:
        chatbot_tools.append(Tool(
            name="DepressionSupport",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['depression'].invoke(q)]),
            description="Comprehensive depression information and support. Use for questions about: depression symptoms and types, major depressive disorder, treatment options (therapy, medication), self-care strategies, supporting loved ones with depression, seasonal depression, postpartum depression, and recovery approaches."
        ))

    if 'bipolar_disorder' in retrievers:
        chatbot_tools.append(Tool(
            name="BipolarDisorderGuide",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['bipolar_disorder'].invoke(q)]),
            description="Detailed information about bipolar disorder and mood episodes. Use for questions about: manic and depressive episodes, bipolar I vs bipolar II, diagnosis and treatment, mood stabilizers, therapy options, managing mood swings, recognizing triggers, family support, and long-term management strategies."
        ))

    if 'ocd' in retrievers:
        chatbot_tools.append(Tool(
            name="OCDInformation",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['ocd'].invoke(q)]),
            description="Detailed guide to Obsessive-Compulsive Disorder (OCD). Use for questions about: OCD symptoms (obsessions and compulsions), diagnosis process, treatment approaches (ERP therapy, medication), managing intrusive thoughts, family support, different types of OCD, and recovery strategies."
        ))

    if 'ptsd' in retrievers:
        chatbot_tools.append(Tool(
            name="PTSDSupport",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['ptsd'].invoke(q)]),
            description="Comprehensive PTSD information and support. Use for questions about: PTSD symptoms and diagnosis, trauma responses, treatment options (trauma-focused therapy, EMDR), coping strategies, supporting trauma survivors, complex PTSD, military PTSD, and recovery approaches."
        ))

    if 'schizophrenia' in retrievers:
        chatbot_tools.append(Tool(
            name="SchizophreniaGuide",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['schizophrenia'].invoke(q)]),
            description="Comprehensive schizophrenia information and support. Use for questions about: schizophrenia symptoms (positive, negative, cognitive), diagnosis and treatment, antipsychotic medications, psychosocial treatments, family education, supported employment, and long-term management."
        ))

    if 'psychosis' in retrievers:
        chatbot_tools.append(Tool(
            name="PsychosisInformation",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['psychosis'].invoke(q)]),
            description="Information about psychosis and related conditions. Use for questions about: psychosis symptoms (hallucinations, delusions), early warning signs, treatment approaches, antipsychotic medications, coordinated specialty care, family support, and recovery-oriented services."
        ))

    if 'stress' in retrievers:
        chatbot_tools.append(Tool(
            name="StressManagement",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['stress'].invoke(q)]),
            description="Stress management information and techniques. Use for questions about: stress vs anxiety differences, stress symptoms, coping strategies, relaxation techniques, stress prevention, work-life balance, and when stress becomes a problem requiring professional help."
        ))

    if 'suicide' in retrievers:
        chatbot_tools.append(Tool(
            name="SuicidePreventionSupport",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['suicide'].invoke(q)]),
            description="Critical suicide prevention information and support resources. Use for questions about: suicide warning signs, risk factors, how to help someone in crisis, crisis intervention, suicide prevention strategies, supporting survivors, and emergency resources including crisis hotlines."
        ))

    if 'general_articles' in retrievers:
        chatbot_tools.append(Tool(
            name="GeneralMentalHealthInfo",
            func=lambda q: "\n\n".join([doc.page_content for doc in retrievers['general_articles'].invoke(q)]),
            description="General mental health information and education. Use for questions about: mental health basics, common mental health conditions, stigma reduction, mental wellness, prevention strategies, and general mental health awareness topics."
        ))

    logger.info(f"[INFO] Successfully initialized {len(mitra_tools)} LangChain Tools")
    logger.info(f"[INFO] Successfully initialized {len(chatbot_tools)} LangChain Tools")

except Exception as e:
    logger.error(f"[ERROR] Failed to initialize tools: {str(e)}", exc_info=True)
    raise