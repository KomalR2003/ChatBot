from logger import logger

def query_chain(chain_components, user_input: str):
    """Process user query using MongoDB-based retrieval"""
    try:
        logger.info(f"User input: {user_input}")

        chain = chain_components["chain"]
        retriever = chain_components["retriever"]

        logger.debug("Starting retrieval...")
        relevant_docs = retriever.get_relevant_documents(user_input)
        logger.debug(f"Retrieval done. Got {len(relevant_docs)} docs")

        # Build context (limit to avoid timeout)
        context = ""
        sources = []
        for doc in relevant_docs:
            snippet = doc.get("content", "")[:500]  # only first 500 chars
            context += snippet + "\n\n"
            source = doc.get("source", "")
            page = doc.get("page", 0)
            if source:
                source_info = f"{source} (page {page})" if page else source
                sources.append(source_info)

        logger.debug("Calling LLM...")
        result = chain.run(context=context, question=user_input)
        logger.debug("LLM done")

        response = {
            "response": result,
            "sources": list(set(sources))  # deduplicate
        }

        logger.debug(f"Final response: {response}")
        return response

    except Exception as e:
        logger.exception("Error in query_chain")
        raise
