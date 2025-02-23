import pandas as pd

# CSVファイルを読み込む
df1 = pd.read_csv('urls.csv')  # 最初のCSVファイル
df2 = pd.read_csv('urls2.csv')  # 二番目のCSVファイル

# prefecture列をキーにしてマージ
merged_df = df1.merge(df2, on='prefecture', suffixes=('1', '2'))

# 結果を新しいCSVファイルに保存
merged_df.to_csv('result.csv', index=False)