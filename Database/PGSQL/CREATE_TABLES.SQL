DO $TABLES$
BEGIN
	RAISE INFO '================    CREATE CORE TABLES     ================';

END $TABLES$;

-- FIND Schema Tables
\ir ../TABLES/CATEGORY.sql
\ir ../TABLES/COLLECTION_JUNCTION.sql
\ir ../TABLES/COLLECTION.sql
\ir ../TABLES/COUNTRY_ALTNAME_LKUP.sql
\ir ../TABLES/COUNTRY.sql
\ir ../TABLES/DATA.sql
\ir ../TABLES/INDICATOR.sql
