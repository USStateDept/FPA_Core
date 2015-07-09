import psycopg2
import sys


con = None

f = open('newest_fields2.txt', 'r')
g= open('missing2.txt','w')

new_dict = {}

for line in f:
	parts=line.split('*')
	label=parts[0]
	subpart=parts[-4:]
	new_dict[label]=subpart
    
f.close()

try:
     
    s="***Conn string***"
    con = psycopg2.connect(s) 
    
    cur = con.cursor() 
    #select every table in public schema that ends in time
    cur.execute("""SELECT label FROM dataset""")    
        
    rows = cur.fetchall()

    for row in rows:
        label=row[0]
        if label in new_dict:
            ws = new_dict[label][0]
            agency = new_dict[label][1]
            org = new_dict[label][2]
            notes = new_dict[label][3]
            notes = notes.replace("'","''")
            cur.execute("update dataset set webservice='" + ws + "', agency='" + agency + "', organization='" + org + "', notes='" + notes + "' where label like '%" + label + "%'")
            con.commit()
        else:
            g.write(label + "\n")
        print label
        
    g.close()
            
except psycopg2.DatabaseError, e:
    print 'Error %s' % e    
    sys.exit(1)
    
    
finally:
    
    if con:
        con.close()