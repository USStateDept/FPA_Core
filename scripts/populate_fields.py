import psycopg2
import sys


con = None

f = open('new_fields.txt', 'r')
g= open('missing.txt','w')

new_dict = {}

for line in f:
	parts=line.split('~')
	label=parts[0]
	subpart=parts[-3:]
	new_dict[label]=subpart
    
f.close()

try:
     
    s="****Conn String****"
    con = psycopg2.connect(s) 
    
    cur = con.cursor() 
    #select every table in public schema that ends in time
    cur.execute("""SELECT label FROM dataset""")    
        
    rows = cur.fetchall()

    for row in rows:
        label=row[0]
        if label in new_dict:
            url = new_dict[label][0]
            uf = new_dict[label][1]
            units = new_dict[label][2]
            cur.execute("update dataset set update_freq='" + uf + "', orgurl='" + url + "', units='" + units + "' where label like '%" + label + "%'")
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