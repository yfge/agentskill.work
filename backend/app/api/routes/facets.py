from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.facets import FacetItem, FacetList
from app.services.facets_service import (
    list_top_languages,
    list_top_owners,
    list_top_topics,
)

router = APIRouter(prefix="/facets", tags=["facets"])


@router.get("/topics", response_model=FacetList)
def list_topics(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),  # noqa: B008
) -> FacetList:
    items = [
        FacetItem(value=value, count=count)
        for value, count in list_top_topics(db, limit)
    ]
    return FacetList(items=items)


@router.get("/languages", response_model=FacetList)
def list_languages(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),  # noqa: B008
) -> FacetList:
    items = [
        FacetItem(value=value, count=count)
        for value, count in list_top_languages(db, limit)
    ]
    return FacetList(items=items)


@router.get("/owners", response_model=FacetList)
def list_owners(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),  # noqa: B008
) -> FacetList:
    items = [
        FacetItem(value=value, count=count)
        for value, count in list_top_owners(db, limit)
    ]
    return FacetList(items=items)
