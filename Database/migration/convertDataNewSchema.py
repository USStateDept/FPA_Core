import psycopg2
import sys


s="***conection string*****"
con = psycopg2.connect(s) 

def populateDataTable():
	try: 
		
		cur = con.cursor() 
		
		cur.execute("""SELECT table_name FROM information_schema.tables WHERE table_schema='finddata' limit 1 """)    
			
		rows = cur.fetchall()

		for row in rows:
			
			table_name = row[0]
			table_name_strip = table_name[:table_name.find('__denorm')]
			
			print table_name

			cur.execute("""select id from public."dataset" where name like '%""" + table_name_strip + "%'" ) 

			rows2= cur.fetchall()
			indId=rows2[0][0]
			
			print indId

			cur.execute("select time, amount, country_level0_id from finddata.\"" + table_name + "\"" )

			rows3= cur.fetchall()

			for row3 in rows3:

				time=row3[0]
				amount=row3[1]
				country_level0_id=row3[2]

				cur.execute("""insert into find."data" ( year, value,country_id,data_modified_ts, indicator_id) VALUES 
					(""" + str(time) + "," + str(amount) + "," + str(country_level0_id) + ", now()," + str(indId) + ")")

		con.commit()
			
			
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)

def populateCountryAltNameTable():
	try: 
		
		cur = con.cursor() 

		cur.execute("""INSERT INTO find."country_altname_lkup" (country_id, country_altname) select country_level0_id,altname from public."geometry__alt_names" """)
	
		con.commit()
			
			
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)

def populateCountryTable():
	try: 
		
		cur = con.cursor() 

		cur.execute("""update public."geometry__country_level0" set dos_region = '' where dos_region is null""")

		cur.execute("""update public."geometry__country_level0" set usaid_reg = '' where usaid_reg is null""")

		cur.execute("""update public."geometry__country_level0" set dod_cmd = '' where dod_cmd is null""")

		cur.execute("""update public."geometry__country_level0" set wb_inc_lvl = '' where wb_inc_lvl is null""")
		
		cur.execute("""INSERT INTO find."country" (country_id, continent,dod_group,dos_group, usaid_group, income_group, country_name, sub_country_name, country_geography) select gid,continent, dod_cmd,dos_region,usaid_reg,wb_inc_lvl,sovereignt,geounit,geom from public."geometry__country_level0"
 """)    
			
		con.commit()
			
			
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)

def populateCollectionsJunctionTable():
	try: 
		
		cur = con.cursor() 
		
		cur.execute("""select dataset_id,tags_id from public."tags_dataset" where tags_id > 31""")    
			
		rows = cur.fetchall()

		for row in rows:
			
			dataId = row[0]
			tagID = row[1]
			print dataId
			
			cur.execute("""insert into find."collection_junction" ( indicator_id, category_id,data_modified_ts) VALUES (""" + str(dataId) + "," + str(tagID) + ",now())")

		con.commit()
			
			
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)

def populateCategoriesJunctionTable():
	try: 
		
		cur = con.cursor() 
		
		cur.execute("""select dataset_id,tags_id from public."tags_dataset" where tags_id < 32""")    
			
		rows = cur.fetchall()

		for row in rows:
			
			dataId = row[0]
			tagID = row[1]
			
			cur.execute("""insert into find."category_junction" ( indicator_id, category_id,data_modified_ts) VALUES (""" + str(dataId) + "," + str(tagID) + ",now())")

		con.commit()
			
			
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)

def populateIndicatorsTable():
	try: 
		
		cur = con.cursor() 
		
		cur.execute("""select dataset.id, dataset.label, dataset.webservice, dataorg.label as dataorg, metadataorg.label as metadataorg, dataset.definition, 
			dataset.orgurl, dataset.years, dataset.update_cycle, dataset.scope, dataset.units, dataset.lastorgupdate, dataset.whentoupdate from public."dataset" 
			left outer join public."dataorg" on dataset.dataorg_id = dataorg.id
			left outer join public."metadataorg" on dataset.metadataorg_id = dataorg.id order by dataset.id""")    
			
		rows = cur.fetchall()

		for row in rows:
			
			oldId = row[0]
			name = row[1]
			url=row[2]
			if url is None:
				url=""
			direct=row[3]
			if direct is None:
				direct=""
			original=row[4]
			if original is None:
				original=""
			definition=row[5]
			if definition is None:
				definition=""
			elif (definition.find('\'')>-1):
				definition= definition.replace('\'','\'\'')
			orgurl=row[6]
			if orgurl is None:
				orgurl=""
			years=row[7]
			if years is None:
				years=""
			update_cycle=row[8]
			if update_cycle is None:
				update_cycle=""
			scope=row[9]
			if scope is None:
				scope=""
			units=row[10]
			if units is None:
				units=""
			lastorgupdate=row[11]
			if lastorgupdate is None:
				lastorgupdate=""
			whentoupdate=row[12]
			if whentoupdate is None:
				whentoupdate=""
			
			cur.execute("""insert into find."indicator" ( indicator_id, data_modified_ts, indicator_name, indicator_url, direct_indicator_source, original_indicator_source, 
				indicator_def, indicator_data_url, years,update_cycle,scope,units, last_source_update_ts,when_to_update_ts) VALUES 
			(""" + str(oldId) + ",now(),'" + name +  "','" +url + "','" + direct + "','" + original + "','" + definition + "','" + orgurl + "','" + years + "','" 
				+ update_cycle + "','" + scope + "','" + units +  "',now(),now())")

		con.commit()
			
			
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)


def populateCollectionsTable():
	try: 
		
		cur = con.cursor() 
		
		cur.execute("""select * from public."tags" where category like 'colls'""")    
			
		rows = cur.fetchall()

		for row in rows:
			
			oldId = row[0]
			name = row[2]
			
			cur.execute("""insert into find."collection" ( collection_name, collection_id,data_modified_ts) VALUES ('""" + name + "'," + str(oldId) + ",now())")

		con.commit()
			
			
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)


def populateCategoriesTable():
	try:
		
		cur = con.cursor() 
		#select every table in public schema that ends in time
		cur.execute("""select * from public."tags" where category like 'spsd'""")    
			
		rows = cur.fetchall()

		for row in rows:
			
			oldId= row[0]
			print oldId
			name = row[2]
			
			cur.execute("""insert into find."category" (category_name, subcategory_name,category_id, data_modified_ts) VALUES ('""" + name + "',''," + str(oldId) + ",now())")


		cur.execute("""select * from public."tags" where category like 'subspsd'""")    
			
		rows = cur.fetchall()

		for row in rows:
			
			oldId=row[0]
			print oldId
			name = row[2]
			
			cur.execute("""insert into find."category" (category_name, subcategory_name, category_id, data_modified_ts) VALUES ('','""" + name + "'," + str(oldId) + ",now())")
		
		con.commit()
			
			
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)
	    

def main():
	
	#populateCollectionsTable()   
	#populateCategoriesTable()
	#populateIndicatorsTable()
	#populateCategoriesJunctionTable()
	#populateCollectionsJunctionTable()
	#populateCountryTable()
	populateDataTable()


if __name__ == "__main__":
    main()

