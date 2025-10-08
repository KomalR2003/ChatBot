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
        You are an AI assistant.

        Answer the user's query as directly and helpfully as possible.
        Use the document context if it contains relevant information.
        If the context is not useful or does not cover the question, use your general knowledge instead.

        Rules:
        - Do not mention the document, context, or PDF in your answer.
        - Do not say things like "according to the document" or "the document does not contain".
        - Always give a natural, direct, and complete answer.
        
        Document Context:
        {context}
        
        Question: {question}
        
        Answer: Please provide a helpful and accurate answer.
        Be straight forward with the answer.
        #NO PREAMBLE
        """
        
        general_knowledge_template = """
        You are a helpful AI assistant.

        Answer the user's question as directly and informatively as possible using your general knowledge.

        Rules:
        - Do not mention documents, PDFs, or context.
        - Always give a natural, straightforward answer.
        
        Question: {question}
        
        Answer: Please provide a helpful and accurate answer using your general knowledge. 
        Be informative and comprehensive in your response.
        Be straight forward with the answer.
        #NO PREAMBLE
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