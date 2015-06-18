import psycopg2
import sys


con = None

try:
     
    s="**********Conection String*******"
    con = psycopg2.connect(s) 
    
    cur = con.cursor() 
    #select every table in public schema that ends in time
    cur.execute("""SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' and table_name like '%time'""")    
        
    rows = cur.fetchall()

    for row in rows:
        #print row[0]
        table_withou_time=row[0][:-6]
        if row[0].find("geometry")==-1:
            #select years in table
            cur.execute("""SELECT year FROM """ + row[0])
            rows2 = cur.fetchall()
        
            yearString=""
            
            #loop through years
            for row2 in rows2:
                #stuff years into comma delimited string
                yearString+=row2[0] + ","
            
            yearString=yearString[:-1]
            print table_withou_time + " " +row[0] + " " + yearString
            #update years column with years string
            cur.execute("""update dataset set years='""" + yearString + """' where name like '""" + table_withou_time +"'")
            con.commit()
            
except psycopg2.DatabaseError, e:
    print 'Error %s' % e    
    sys.exit(1)
    
    
finally:
    
    if con:
        con.close()