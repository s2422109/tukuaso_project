import requests
from bs4 import BeautifulSoup
import csv
import pandas as pd
import google.generativeai as genai
import re

# Gemini APIの設定
GOOGLE_API_KEY = 'AIzaSyBWOujCNM9LpKmqPd-EZlPMGQLqyqwbqDs'
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# CSVファイルのパス
urls_csv = "urls.csv"
urls2_csv = "urls2.csv"
result_csv = "result.csv"

# 結果を格納するための空のDataFrameを作成
df = pd.read_csv(result_csv)

# 流星群データの取得と分析
def get_meteor_data():
    url = "https://www.ferry-sunflower.co.jp/lp/nightsky/2024/07.html"
    try:
        response = requests.get(url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        txt_small_elements = soup.find_all('ul', class_='txt-small')
        
        meteor_data = []
        for element in txt_small_elements:
            meteor_data.append(element.text.strip())
        
        return "\n".join(meteor_data)
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return None

def analyze_with_gemini(meteor_data):
    prompt = """
    あなたは織姫のための彦星監視システムのアナリストです。
    以下の天文データを分析し、彦星（わし座のアルタイル/α星）の周辺を通過する流星群の影響から、
    彦星が浮気をしている可能性を評価してください。

    評価基準：
    1. 流星群の接近距離と強さ
    2. 流星群の活動期間の長さ
    3. 他の星々との接近状況
    4. 織姫星（こと座のベガ）との相対的な位置関係

    以下の形式で回答してください：
    1. 検出された関連流星群の詳細
    2. 各流星群による浮気リスク評価
    3. 総合的な浮気の可能性を0-100%で表示
    4. 織姫への注意アドバイス

    データ:
    {}
    """.format(meteor_data)

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini APIエラー: {e}")
        return None

# 浮気可能性の数値を抽出する関数
def extract_percentage(text):
    match = re.search(r'(\d+)%', text)
    return match.group(1) if match else "取得できません"

# Geminiの分析を実行し、50行目のstarsに値を格納
meteor_data = get_meteor_data()
if meteor_data:
    analysis = analyze_with_gemini(meteor_data)
    if analysis:
        stars_percentage = extract_percentage(analysis)
        # 50行目のstarsに値を格納
        df.loc[49, 'stars'] = stars_percentage

# 1つ目のURLsからデータを取得
with open(urls_csv, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    for i, row in enumerate(reader):
        prefecture, url = row
        response = requests.get(url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        tr_tags = soup.find_all('tr', class_='mtx')
        tr_tag_sub = tr_tags[9:10]
        for tr_tag in tr_tags[10:11]:
            td_tags = tr_tag.find_all('td')
            try:
                average_pressure = td_tags[1].text
                average_temperature = td_tags[10].text
                average_humidity = td_tags[16].text
            except IndexError:
                average_pressure = "取得できません"
                average_temperature = tr_tag_sub[0].find_all('td')[6].text
                average_humidity = tr_tag_sub[0].find_all('td')[12].text

            df.loc[i, 'average_pressure'] = average_pressure
            df.loc[i, 'average_temperature'] = average_temperature
            df.loc[i, 'average_humidity'] = average_humidity

# 2つ目のURLsからデータを取得
with open(urls2_csv, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)
    for i, row in enumerate(reader):
        prefecture, url = row
        response = requests.get(url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        target_td = soup.find('td', {'data-day': '2024-07-07'})
        if target_td:
            data_mark_text = target_td['data-mark_text']
            df.loc[i, 'weather'] = data_mark_text
        else:
            df.loc[i, 'weather'] = "データなし"

# 結果をCSVファイルに保存
df.to_csv(result_csv, index=False)
print(f"\nデータを {result_csv} に保存しました。")