import xml.etree.ElementTree as ET
import requests
import psycopg2
import sys



def callWebService(webservice):
	end = webservice.find('?')
	begin = webservice.find('indicator')+11
	indicatorID=webservice[begin:end]

	apiUrl = 'http://api.worldbank.org/indicator/' + indicatorID

	resp = requests.get(apiUrl)

	xml = resp.text

	bracketIndex = xml.index('<')
	xml = xml[bracketIndex:]

	root = ET.fromstring(xml.encode('utf-8'))




	name = root[0][0].text

	if(name.find('(')>-1):
		openParthenIndex = name.index('(')+1
		closeParenthIndex = name.index(')')
		unit = name[openParthenIndex:closeParenthIndex]
		unit=unit.replace("'","''")
	else:
		unit=""

	url = 'http://data.worldbank.org/indicator/' + root[0].attrib.get('id')

	directSource = root[0][1].text
	originalSource = root[0][3].text

	note = root[0][2].text

	directSource=directSource.replace("'","''")
	originalSource=originalSource.replace("'","''")
	note=note.replace("'","''")

	return unit, url,directSource,originalSource,note

def main():
	try:
		 
		s="******connection string**********"
		con = psycopg2.connect(s) 
		
		cur = con.cursor() 
		#select every table in public schema that ends in time
		cur.execute("""select label,orgurl,webservice from public."dataset" where webservice like '%worldbank%'""")    
			
		rows = cur.fetchall()

		for row in rows:
			label=row[0]
			orgurl=row[1]
			webservice=row[2]
			print webservice
			units, indicatorURL, directSource, originalSource, definition = callWebService(webservice)

			cur.execute("update dataset set units='" + units + "', orgurl='" + indicatorURL + "', definition='" + definition +  "' where label like '%" + label + "%'")
			con.commit()
			
			cur.execute("""select id, label from public."dataorg" where label like '""" + directSource + "'")
			rows2=cur.fetchall()

			if(len(rows2)==0):
				cur.execute("insert into dataorg  (label) values ('" + directSource + "')")
				con.commit()

				cur.execute("select id, label from public.\"dataorg\" where label like '" + directSource + "'")

				rows3=cur.fetchall()
				id=rows3[0][0]
				label2=rows3[0][1] 
				cur.execute("update dataset set dataorg_id=" + str(id) + " where label like '%" + label + "%'")
				con.commit()
				 
			else:
				id=rows2[0][0]
				label2=rows2[0][1]
				cur.execute("update dataset set dataorg_id=" + str(id) + " where label like '%" + label + "%'")
				con.commit()
            #metadataorg    
                
			cur.execute("""select id, label from public."metadataorg" where label like '""" + originalSource + "'")
			rows4=cur.fetchall()

			if(len(rows4)==0):
				cur.execute("insert into metadataorg  (label) values ('" + originalSource + "')")
				con.commit()

				cur.execute("select id, label from public.\"metadataorg\" where label like '" + originalSource + "'")

				rows5=cur.fetchall()
				id=rows5[0][0]
				label2=rows5[0][1]  
				cur.execute("update dataset set metadataorg_id=" + str(id) + " where label like '%" + label + "%'")
				con.commit()
				
			else:
				id=rows4[0][0]
				label2=rows4[0][1]
				cur.execute("update dataset set metadataorg_id=" + str(id) + " where label like '%" + label + "%'")
				con.commit()
	except psycopg2.DatabaseError, e:
	    print 'Error %s' % e    
	    sys.exit(1)
	    
	    
	finally:
	    
	    if con:
	        con.close()


if __name__ == "__main__":
    main()






