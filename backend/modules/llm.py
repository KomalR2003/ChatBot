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

class MongoDBRetriever:
    def __init__(self, collection, embeddings_model, k=3):
        self.collection = collection
        self.embeddings_model = embeddings_model
        self.k = k
    
    def get_relevant_documents(self, query):
        """Retrieve relevant documents from MongoDB"""
        return similarity_search(query, self.collection, self.embeddings_model, self.k)

def get_llm_chain(collection):
    """Create LLM chain with MongoDB retriever"""
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
        
        # Create custom retriever
        retriever = MongoDBRetriever(collection, embeddings, k=2)
        
        # Create prompt template
        prompt_template = """
        Use the following context to answer the question. If you don't know the answer based on the context, just say that you don't know.
        
        Context:
        {context}
        
        Question: {question}
        
        Answer:
        """
        
        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Create chain
        chain = LLMChain(llm=llm, prompt=prompt)
        
        return {
            "chain": chain,
            "retriever": retriever
        }
        
    except Exception as e:
        logger.error(f"Error creating LLM chain: {e}")
        raise