### Shapefile to topojson
    $ topojson -o uk_boundaries_shrunk.json uk_boundaries_shrunk.shp
### Mapshaper
    (website)➜  data git:(master) ✗ mapshaper -o eng_boundaries.json --id-field NAME_2  -f topojson --repair -p 0.005 --filter "NAME_1 == 'England'" --cut-table --encoding utf8  uk_boundaries.shp
    Repaired 2 intersections; unable to repair 0 intersections.
    Wrote eng_boundaries.json
    Wrote eng_boundaries-table.json

### Python
    reader_hps = csv.DictReader(open('uk_median_house_prices_1997_to_2012.csv'))
    for hp in reader_hps:
        house_prices.append(hp)
    for hp in house_prices:
        hp['id'] = ' '.join(hp['Reference area'].split()[1:])

    for r in region_name:
        ...:     if r not in house_price_names:
        ...:         print r
        ...:         
    Bedfordshire
    Berkshire
    Bristol
    Cheshire
    Durham
    Herefordshire
    Kingston upon Hull
    London
    Merseyside* (liverpool, st helens, wirral)
    South Yorkshire (barnsley, doncaster, rotherham, sheffield)
    Tyne and Wear* (newcastle, sunderland, tyneside north and south)
    West Midlands* (birmingham, coventry, wolverhampton)
    West Yorkshire (bradford, leeds, wakefield)

    def clean_data():
        regions = json.load(open('eng_boundaries-table.json'))
        region_names = [rn['NAME_2'] for rn in regions]
        reader = csv.DictReader(open('uk_median_house_prices_1997_to_2012.csv'))
        house_prices = []
        hp_names = []

        for hp in reader:
            house_prices.append(hp)
        for hp in house_prices:
            hp['id'] = ' '.join(hp['Reference area'].split()[1:])
            hp_names.append(hp['id'])
        print 'House-price names:' + repr(hp_names)
        for rn in region_names:
            if rn not in hp_names:
                print rn

   
