import os
from dotenv import load_dotenv
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings  
from modules.load_vectorstore import similarity_search
from logger import logger

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

class HybridRetriever:
    def __init__(self, collection, embeddings_model, k=3):
        self.collection = collection
        self.embeddings_model = embeddings_model
        self.k = k
    
    def get_relevant_documents(self, query):
        """Retrieve relevant documents from MongoDB, return None if no good matches"""
        try:
            results = similarity_search(query, self.collection, self.embeddings_model, self.k)
            
            # Check if we have any results and if they have good similarity scores
            if not results:
                return None
            
            # Filter results with decent similarity (this is a simple threshold approach)
            # In a real implementation, you might want to use a more sophisticated approach
            good_results = []
            for result in results:
                similarity = result.get('similarity', 0)
                # Only include if similarity is above a threshold (adjust as needed)
                if similarity > 0.1:  # Adjust this threshold based on your needs
                    good_results.append(result)
            
            return good_results if good_results else None
            
        except Exception as e:
            logger.error(f"Error in document retrieval: {e}")
            return None

def get_llm_chain(collection):
    """Create LLM chain with hybrid approach (documents + general knowledge)"""
    try:
        # Initialize LLM
        print("Loaded GROQ_API_KEY:", GROQ_API_KEY)
        llm = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name="llama-3.1-8b-instant",
            temperature=0.1
        )
        
        # Initialize embeddings
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L12-v2")
        
        # Create hybrid retriever
        retriever = HybridRetriever(collection, embeddings, k=3)
        
        # Create prompt templates for different scenarios
        document_based_template = """
        You are an AI assistant that answers questions based on provided documents and your general knowledge.
        
        Based on the following document context, answer the user's question. If the documents provide relevant information, use that information. If the documents don't contain enough information or the question is about general knowledge, you can also use your general knowledge to provide a comprehensive answer.
        
        Document Context:
        {context}
        
        Question: {question}
        
        Answer: Please provide a helpful and accurate answer. If you're using information from the documents, mention that. If you're using general knowledge, you can mention that as well.
        """
        
        general_knowledge_template = """
        You are a helpful AI assistant. The user is asking a question that doesn't seem to be related to any specific documents in your knowledge base.
        
        Question: {question}
        
        Answer: Please provide a helpful and accurate answer using your general knowledge. Be informative and comprehensive in your response.
        """
        
        document_prompt = PromptTemplate(
            template=document_based_template,
            input_variables=["context", "question"]
        )
        
        general_prompt = PromptTemplate(
            template=general_knowledge_template,
            input_variables=["question"]
        )
        
        # Create chains
        document_chain = LLMChain(llm=llm, prompt=document_prompt)
        general_chain = LLMChain(llm=llm, prompt=general_prompt)
        
        return {
            "document_chain": document_chain,
            "general_chain": general_chain,
            "retriever": retriever
        }
        
    except Exception as e:
        logger.error(f"Error creating LLM chain: {e}")
        raise