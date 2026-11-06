import urllib.request
import urllib.parse
import json

queries = [
    'fire flame smoke video',
    'building rooftop edge video',
    'person fall slip video',
    'medical emergency cctv',
    'thermal camera video'
]

for q in queries:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(q)}+filetype:video&srnamespace=6&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'DrishtiBot/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            d = json.loads(res.read().decode('utf-8'))
            results = [x['title'] for x in d.get('query', {}).get('search', [])[:4]]
            print(f"{q}: {results}")
    except Exception as e:
        print(f"{q} ERR: {e}")

