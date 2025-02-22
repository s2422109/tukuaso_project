import requests
from bs4 import BeautifulSoup
import csv

# CSVファイルのパス
csv_file = "urls.csv"

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)  # ヘッダー行をスキップ
    for row in reader:
        prefecture, url = row

        response = requests.get(url)
        response.encoding = 'utf-8'

        soup = BeautifulSoup(response.text, 'html.parser')

        tr_tags = soup.find_all('tr', class_='mtx')
        tr_tag_sub = tr_tags[9:10]
        for tr_tag in tr_tags[10:11]:
            td_tags = tr_tag.find_all('td')
            # try-exceptでエラーをキャッチ
            try:
                average_pressure = td_tags[1].text
                average_temperature = td_tags[10].text
                average_humidity = td_tags[16].text
            except IndexError:
                average_pressure = "取得できません"
                average_temperature = tr_tag_sub[0].find_all('td')[6].text  # インデックス[0]を追加
                average_humidity = tr_tag_sub[0].find_all('td')[12].text  # インデックス[0]を追加

            # 都道府県名とデータを出力
            print(f"{prefecture}:")  
            print(f"  平均気圧: {average_pressure}")
            print(f"  平均気温: {average_temperature}")
            print(f"  平均湿度: {average_humidity}")