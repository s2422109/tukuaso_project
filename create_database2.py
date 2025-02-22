import requests
from bs4 import BeautifulSoup
import csv

csv_file = "urls2.csv"  # CSVファイル名を指定

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # ヘッダー行をスキップ

    for row in reader:
        prefecture, url = row

        response = requests.get(url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        target_td = soup.find('td', {'data-day': '2024-07-07'})

        if target_td:
            data_mark_text = target_td['data-mark_text']
            print(f"{prefecture}: {data_mark_text}")
        else:
            print(f"{prefecture}: data-day='2023-07-07' のtdタグは見つかりませんでした。")