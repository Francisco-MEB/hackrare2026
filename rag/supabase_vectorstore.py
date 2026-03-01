import warnings
from typing import Any, Dict, List, Optional, Tuple

from langchain_core.documents import Document
from langchain_community.vectorstores import SupabaseVectorStore


class SupabaseVectorStoreFixed(SupabaseVectorStore):
    def _match_args(self, query: List[float], filter: Optional[Dict[str, Any]], k: int) -> Dict[str, Any]:
        ret: Dict[str, Any] = {"query_embedding": query, "limit": k}
        if filter:
            ret["filter"] = filter
        return ret

    def similarity_search_by_vector_with_relevance_scores(
        self,
        query: List[float],
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        postgrest_filter: Optional[str] = None,
        score_threshold: Optional[float] = None,
    ) -> List[Tuple[Document, float]]:
        params = self._match_args(query, filter, k)
        res = self._client.rpc(self.query_name, params).execute()

        match_result = [
            (
                Document(
                    metadata=search.get("metadata", {}),
                    page_content=search.get("content", ""),
                ),
                search.get("similarity", 0.0),
            )
            for search in res.data
            if search.get("content")
        ]

        if score_threshold is not None:
            match_result = [
                (doc, sim) for doc, sim in match_result if sim >= score_threshold
            ]
            if len(match_result) == 0:
                warnings.warn(
                    f"No relevant docs retrieved with score threshold {score_threshold}"
                )
        return match_result
