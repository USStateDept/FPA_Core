# This is what a data viz query looks like

SELECT 
	COUNT(gdp_growth__denorm.geom_time_id) AS "count", 
	AVG(gdp_growth__denorm.amount) AS "gdp_growth__avg", 
	MAX(gdp_growth__denorm.amount) AS "gdp_growth__max", 
	MIN(gdp_growth__denorm.amount) AS "gdp_growth__min", 
	gdp_growth__denorm.name AS "geo__name", 
	gdp_growth__denorm.time AS "time" 
FROM 
	finddata.gdp_growth__denorm AS gdp_growth__denorm
WHERE 
	(gdp_growth__denorm.name IN ('china','russia','united states of america'))
	AND 
	(gdp_growth__denorm.time >= 1990)
	AND
	(gdp_growth__denorm.time <= 2013)
	AND
	(gdp_growth__denorm.amount IS NOT NULL)
GROUP BY 
	gdp_growth__denorm.name, 
	gdp_growth__denorm.time 
ORDER BY time ASC