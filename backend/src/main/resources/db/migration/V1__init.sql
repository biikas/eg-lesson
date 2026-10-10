-- eglesson schema. All timestamps are UTC. Flyway owns the schema; Hibernate only validates in prod.

-- ---------------------------------------------------------------- admin access
CREATE TABLE role (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  description VARCHAR(255) NULL,
  system_role BIT(1)       NOT NULL DEFAULT 0,
  created_at  DATETIME(6)  NOT NULL,
  CONSTRAINT uk_role_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permission (
  role_id    BIGINT      NOT NULL,
  permission VARCHAR(40) NOT NULL,
  PRIMARY KEY (role_id, permission),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id) REFERENCES role (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_user (
  id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
  username             VARCHAR(60)  NOT NULL,
  full_name            VARCHAR(120) NOT NULL,
  email                VARCHAR(160) NULL,
  password_hash        VARCHAR(100) NOT NULL,
  role_id              BIGINT       NOT NULL,
  active               BIT(1)       NOT NULL DEFAULT 1,
  must_change_password BIT(1)       NOT NULL DEFAULT 0,
  last_login_at        DATETIME(6)  NULL,
  created_at           DATETIME(6)  NOT NULL,
  updated_at           DATETIME(6)  NOT NULL,
  CONSTRAINT uk_admin_user_username UNIQUE (username),
  CONSTRAINT fk_admin_user_role FOREIGN KEY (role_id) REFERENCES role (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- catalog (configurable tree)
CREATE TABLE node_type (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(40) NOT NULL,
  label      VARCHAR(60) NOT NULL,
  icon       VARCHAR(60) NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  CONSTRAINT uk_node_type_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE catalog_node (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id    BIGINT       NULL,
  node_type_id BIGINT       NOT NULL,
  name         VARCHAR(150) NOT NULL,
  short_name   VARCHAR(60)  NULL,
  slug         VARCHAR(190) NOT NULL,
  description  VARCHAR(1000) NULL,
  icon         VARCHAR(60)  NULL,
  color        VARCHAR(20)  NULL,
  cover_image  VARCHAR(500) NULL,
  path         VARCHAR(500) NOT NULL,
  depth        INT          NOT NULL DEFAULT 0,
  sort_order   INT          NOT NULL DEFAULT 0,
  active       BIT(1)       NOT NULL DEFAULT 1,
  featured     BIT(1)       NOT NULL DEFAULT 0,
  created_at   DATETIME(6)  NOT NULL,
  updated_at   DATETIME(6)  NOT NULL,
  CONSTRAINT uk_catalog_node_slug UNIQUE (slug),
  CONSTRAINT fk_catalog_node_parent FOREIGN KEY (parent_id) REFERENCES catalog_node (id),
  CONSTRAINT fk_catalog_node_type FOREIGN KEY (node_type_id) REFERENCES node_type (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_catalog_node_parent ON catalog_node (parent_id, sort_order);
CREATE INDEX ix_catalog_node_path ON catalog_node (path);

CREATE TABLE content_type (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(40) NOT NULL,
  name       VARCHAR(80) NOT NULL,
  icon       VARCHAR(60) NULL,
  color      VARCHAR(20) NULL,
  sort_order INT         NOT NULL DEFAULT 0,
  active     BIT(1)      NOT NULL DEFAULT 1,
  CONSTRAINT uk_content_type_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- media
CREATE TABLE media (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name   VARCHAR(255) NOT NULL,
  url           VARCHAR(500) NOT NULL,
  content_type  VARCHAR(100) NOT NULL,
  size_bytes    BIGINT       NOT NULL,
  uploaded_by   BIGINT       NULL,
  created_at    DATETIME(6)  NOT NULL,
  CONSTRAINT fk_media_uploader FOREIGN KEY (uploaded_by) REFERENCES admin_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- students
CREATE TABLE student (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(120) NOT NULL,
  email          VARCHAR(160) NULL,
  phone          VARCHAR(20)  NULL,
  password_hash  VARCHAR(100) NOT NULL,
  course_node_id BIGINT       NULL,
  school         VARCHAR(160) NULL,
  district       VARCHAR(60)  NULL,
  avatar_color   VARCHAR(20)  NULL,
  active         BIT(1)       NOT NULL DEFAULT 1,
  last_login_at  DATETIME(6)  NULL,
  created_at     DATETIME(6)  NOT NULL,
  updated_at     DATETIME(6)  NOT NULL,
  CONSTRAINT uk_student_email UNIQUE (email),
  CONSTRAINT uk_student_phone UNIQUE (phone),
  CONSTRAINT fk_student_course FOREIGN KEY (course_node_id) REFERENCES catalog_node (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_student_created ON student (created_at);

-- ---------------------------------------------------------------- posts (notes, solutions, old questions...)
CREATE TABLE post (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  slug             VARCHAR(190) NOT NULL,
  excerpt          VARCHAR(600) NULL,
  body             LONGTEXT     NULL,
  search_text      MEDIUMTEXT   NULL,
  cover_image      VARCHAR(500) NULL,
  node_id          BIGINT       NOT NULL,
  content_type_id  BIGINT       NOT NULL,
  language         VARCHAR(5)   NOT NULL DEFAULT 'EN',
  difficulty       VARCHAR(20)  NULL,
  video_url        VARCHAR(500) NULL,
  status           VARCHAR(20)  NOT NULL,
  featured         BIT(1)       NOT NULL DEFAULT 0,
  allow_comments   BIT(1)       NOT NULL DEFAULT 1,
  published_at     DATETIME(6)  NULL,
  read_minutes     INT          NOT NULL DEFAULT 1,
  meta_title       VARCHAR(255) NULL,
  meta_description VARCHAR(500) NULL,
  author_id        BIGINT       NULL,
  view_count       BIGINT       NOT NULL DEFAULT 0,
  like_count       INT          NOT NULL DEFAULT 0,
  comment_count    INT          NOT NULL DEFAULT 0,
  bookmark_count   INT          NOT NULL DEFAULT 0,
  created_at       DATETIME(6)  NOT NULL,
  updated_at       DATETIME(6)  NOT NULL,
  CONSTRAINT uk_post_slug UNIQUE (slug),
  CONSTRAINT fk_post_node FOREIGN KEY (node_id) REFERENCES catalog_node (id),
  CONSTRAINT fk_post_content_type FOREIGN KEY (content_type_id) REFERENCES content_type (id),
  CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES admin_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_post_status_published ON post (status, published_at);
CREATE INDEX ix_post_node ON post (node_id, status);
CREATE INDEX ix_post_author_created ON post (author_id, created_at);

CREATE TABLE post_tag (
  post_id BIGINT      NOT NULL,
  tag     VARCHAR(60) NOT NULL,
  PRIMARY KEY (post_id, tag),
  CONSTRAINT fk_post_tag_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_post_tag_tag ON post_tag (tag);

CREATE TABLE post_attachment (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id    BIGINT       NOT NULL,
  title      VARCHAR(255) NOT NULL,
  url        VARCHAR(500) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_post_attachment_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE post_view_daily (
  id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id   BIGINT NOT NULL,
  view_date DATE   NOT NULL,
  views     BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT uk_post_view_daily UNIQUE (post_id, view_date),
  CONSTRAINT fk_post_view_daily_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_post_view_daily_date ON post_view_daily (view_date);

-- ---------------------------------------------------------------- engagement
CREATE TABLE post_comment (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id    BIGINT      NOT NULL,
  parent_id  BIGINT      NULL,
  student_id BIGINT      NULL,
  admin_id   BIGINT      NULL,
  body       TEXT        NOT NULL,
  status     VARCHAR(20) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES post_comment (id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_admin FOREIGN KEY (admin_id) REFERENCES admin_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_comment_post_status ON post_comment (post_id, status, created_at);
CREATE INDEX ix_comment_status_created ON post_comment (status, created_at);

CREATE TABLE post_like (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT      NOT NULL,
  post_id    BIGINT      NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT uk_post_like UNIQUE (student_id, post_id),
  CONSTRAINT fk_post_like_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE,
  CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bookmark (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT      NOT NULL,
  post_id    BIGINT      NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT uk_bookmark UNIQUE (student_id, post_id),
  CONSTRAINT fk_bookmark_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmark_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reading_history (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id   BIGINT      NOT NULL,
  post_id      BIGINT      NOT NULL,
  progress     INT         NOT NULL DEFAULT 0,
  last_read_at DATETIME(6) NOT NULL,
  CONSTRAINT uk_reading_history UNIQUE (student_id, post_id),
  CONSTRAINT fk_reading_history_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE,
  CONSTRAINT fk_reading_history_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_reading_history_recent ON reading_history (student_id, last_read_at);

CREATE TABLE student_activity_day (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id   BIGINT NOT NULL,
  activity_day DATE   NOT NULL,
  CONSTRAINT uk_student_activity_day UNIQUE (student_id, activity_day),
  CONSTRAINT fk_student_activity_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- notices, banners & ads
CREATE TABLE notice (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(190) NOT NULL,
  body            MEDIUMTEXT   NULL,
  category        VARCHAR(30)  NOT NULL,
  important       BIT(1)       NOT NULL DEFAULT 0,
  attachment_url  VARCHAR(500) NULL,
  attachment_name VARCHAR(255) NULL,
  node_id         BIGINT       NULL,
  publish_at      DATETIME(6)  NOT NULL,
  expire_at       DATETIME(6)  NULL,
  active          BIT(1)       NOT NULL DEFAULT 1,
  view_count      BIGINT       NOT NULL DEFAULT 0,
  created_by      BIGINT       NULL,
  created_at      DATETIME(6)  NOT NULL,
  updated_at      DATETIME(6)  NOT NULL,
  CONSTRAINT uk_notice_slug UNIQUE (slug),
  CONSTRAINT fk_notice_node FOREIGN KEY (node_id) REFERENCES catalog_node (id) ON DELETE SET NULL,
  CONSTRAINT fk_notice_creator FOREIGN KEY (created_by) REFERENCES admin_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_notice_live ON notice (active, publish_at);

CREATE TABLE promo (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  kind        VARCHAR(20)  NOT NULL,
  title       VARCHAR(200) NOT NULL,
  subtitle    VARCHAR(500) NULL,
  image_url   VARCHAR(500) NULL,
  link_url    VARCHAR(500) NULL,
  cta_text    VARCHAR(60)  NULL,
  placement   VARCHAR(30)  NOT NULL,
  bg_color    VARCHAR(60)  NULL,
  node_id     BIGINT       NULL,
  start_at    DATETIME(6)  NULL,
  end_at      DATETIME(6)  NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  active      BIT(1)       NOT NULL DEFAULT 1,
  impressions BIGINT       NOT NULL DEFAULT 0,
  clicks      BIGINT       NOT NULL DEFAULT 0,
  created_at  DATETIME(6)  NOT NULL,
  updated_at  DATETIME(6)  NOT NULL,
  CONSTRAINT fk_promo_node FOREIGN KEY (node_id) REFERENCES catalog_node (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_promo_placement ON promo (placement, active);

-- ---------------------------------------------------------------- practice quizzes (MCQ)
CREATE TABLE quiz (
  id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
  title              VARCHAR(255)  NOT NULL,
  slug               VARCHAR(190)  NOT NULL,
  description        VARCHAR(1000) NULL,
  node_id            BIGINT        NOT NULL,
  time_limit_minutes INT           NOT NULL DEFAULT 0,
  status             VARCHAR(20)   NOT NULL,
  attempt_count      BIGINT        NOT NULL DEFAULT 0,
  created_by         BIGINT        NULL,
  created_at         DATETIME(6)   NOT NULL,
  updated_at         DATETIME(6)   NOT NULL,
  CONSTRAINT uk_quiz_slug UNIQUE (slug),
  CONSTRAINT fk_quiz_node FOREIGN KEY (node_id) REFERENCES catalog_node (id),
  CONSTRAINT fk_quiz_creator FOREIGN KEY (created_by) REFERENCES admin_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_question (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id     BIGINT NOT NULL,
  text        TEXT   NOT NULL,
  explanation TEXT   NULL,
  sort_order  INT    NOT NULL DEFAULT 0,
  CONSTRAINT fk_quiz_question_quiz FOREIGN KEY (quiz_id) REFERENCES quiz (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_option (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT        NOT NULL,
  text        VARCHAR(1000) NOT NULL,
  correct     BIT(1)        NOT NULL DEFAULT 0,
  sort_order  INT           NOT NULL DEFAULT 0,
  CONSTRAINT fk_quiz_option_question FOREIGN KEY (question_id) REFERENCES quiz_question (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempt (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id          BIGINT      NOT NULL,
  student_id       BIGINT      NOT NULL,
  score            INT         NOT NULL,
  total            INT         NOT NULL,
  duration_seconds INT         NOT NULL DEFAULT 0,
  created_at       DATETIME(6) NOT NULL,
  CONSTRAINT fk_quiz_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES quiz (id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_attempt_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_quiz_attempt_student ON quiz_attempt (student_id, created_at);

-- ---------------------------------------------------------------- note requests from students
CREATE TABLE content_request (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT        NOT NULL,
  node_id    BIGINT        NULL,
  topic      VARCHAR(255)  NOT NULL,
  details    VARCHAR(2000) NULL,
  status     VARCHAR(20)   NOT NULL,
  admin_note VARCHAR(1000) NULL,
  post_id    BIGINT        NULL,
  created_at DATETIME(6)   NOT NULL,
  updated_at DATETIME(6)   NOT NULL,
  CONSTRAINT fk_content_request_student FOREIGN KEY (student_id) REFERENCES student (id) ON DELETE CASCADE,
  CONSTRAINT fk_content_request_node FOREIGN KEY (node_id) REFERENCES catalog_node (id) ON DELETE SET NULL,
  CONSTRAINT fk_content_request_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_content_request_status ON content_request (status, created_at);

-- ---------------------------------------------------------------- settings, search analytics, audit
CREATE TABLE site_setting (
  setting_key   VARCHAR(80) NOT NULL PRIMARY KEY,
  setting_value TEXT        NULL,
  updated_at    DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE search_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  term       VARCHAR(200) NOT NULL,
  results    INT          NOT NULL,
  student_id BIGINT       NULL,
  created_at DATETIME(6)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_search_log_created ON search_log (created_at);
CREATE INDEX ix_search_log_term ON search_log (term);

CREATE TABLE audit_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id   BIGINT       NULL,
  admin_name VARCHAR(120) NULL,
  action     VARCHAR(30)  NOT NULL,
  entity     VARCHAR(40)  NOT NULL,
  entity_id  BIGINT       NULL,
  summary    VARCHAR(500) NULL,
  created_at DATETIME(6)  NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX ix_audit_log_created ON audit_log (created_at);
