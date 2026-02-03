from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.cache import cache_control
from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.facets import FacetItem, FacetList
from app.services.facets_service import (
    list_top_languages,
    list_top_owners,
    list_top_topics,
)

router = APIRouter(prefix="/facets", tags=["facets"])


@router.get("/topics", response_model=FacetList)
@cache_control(3600)  # Cache for 1 hour
def list_topics(
    response: Response,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),  # noqa: B008
    settings=Depends(get_settings),  # noqa: B008
) -> FacetList:
    items = [
        FacetItem(value=value, count=count)
        for value, count in list_top_topics(db, limit, settings)
    ]
    return FacetList(items=items)


@router.get("/languages", response_model=FacetList)
@cache_control(3600)  # Cache for 1 hour
def list_languages(
    response: Response,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),  # noqa: B008
) -> FacetList:
    items = [
        FacetItem(value=value, count=count)
        for value, count in list_top_languages(db, limit)
    ]
    return FacetList(items=items)


@router.get("/owners", response_model=FacetList)
@cache_control(3600)  # Cache for 1 hour
def list_owners(
    response: Response,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),  # noqa: B008
) -> FacetList:
    items = [
        FacetItem(value=value, count=count)
        for value, count in list_top_owners(db, limit)
    ]
    return FacetList(items=items)
