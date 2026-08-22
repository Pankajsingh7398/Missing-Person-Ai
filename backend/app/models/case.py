from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Float,
)

from sqlalchemy.orm import relationship

from app.database import Base


# =========================================================
# MISSING PERSON CASE
# =========================================================

class MissingPersonCase(Base):

    __tablename__ = "missing_person_cases"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    age = Column(
        Integer,
        nullable=True,
    )

    gender = Column(
        String(50),
        nullable=True,
    )

    last_seen_location = Column(
        String(255),
        nullable=True,
    )

    last_seen_date = Column(
        String(50),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    videos = relationship(
        "CCTVVideo",
        back_populates="case",
        cascade="all, delete-orphan",
    )

    analyses = relationship(
        "CCTVAnalysis",
        back_populates="case",
        cascade="all, delete-orphan",
    )


# =========================================================
# CCTV VIDEO
# =========================================================

class CCTVVideo(Base):

    __tablename__ = "cctv_videos"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    case_id = Column(
        Integer,
        ForeignKey(
            "missing_person_cases.id"
        ),
        nullable=False,
        index=True,
    )

    original_filename = Column(
        String(255),
        nullable=False,
    )

    stored_path = Column(
        String(500),
        nullable=False,
    )

    status = Column(
        String(50),
        default="uploaded",
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    case = relationship(
        "MissingPersonCase",
        back_populates="videos",
    )

    analyses = relationship(
        "CCTVAnalysis",
        back_populates="video",
        cascade="all, delete-orphan",
    )


# =========================================================
# CCTV ANALYSIS
# =========================================================

class CCTVAnalysis(Base):

    __tablename__ = "cctv_analyses"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    case_id = Column(
        Integer,
        ForeignKey(
            "missing_person_cases.id"
        ),
        nullable=False,
        index=True,
    )

    video_id = Column(
        Integer,
        ForeignKey(
            "cctv_videos.id"
        ),
        nullable=False,
        index=True,
    )

    analysis_id = Column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    status = Column(
        String(50),
        default="completed",
        nullable=False,
    )

    potential_matches = Column(
        Integer,
        default=0,
    )

    confirmed_sightings = Column(
        Integer,
        default=0,
    )

    best_similarity = Column(
        Float,
        nullable=True,
    )

    results_path = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # -----------------------------------------------------
    # RELATIONSHIPS
    # -----------------------------------------------------

    case = relationship(
        "MissingPersonCase",
        back_populates="analyses",
    )

    video = relationship(
        "CCTVVideo",
        back_populates="analyses",
    )