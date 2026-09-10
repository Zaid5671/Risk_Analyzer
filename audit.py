import sqlite3
import pandas as pd

conn = sqlite3.connect('data/database.sqlite')
tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)
print('Tables:', tables['name'].tolist())

print("\nWork table schema:")
print(pd.read_sql("PRAGMA table_info(work);", conn))

print("\nData check:")
df_works = pd.read_sql('SELECT work_id, sanction_amount, amount_disbursed, is_completed_flag FROM work', conn)
df_exp = pd.read_sql('SELECT work_id, fund_disbursed_amount FROM work_expenditure', conn)

df_exp_agg = df_exp.groupby('work_id')['fund_disbursed_amount'].sum().reset_index()
df_exp_agg.rename(columns={'fund_disbursed_amount': 'agg_disbursed'}, inplace=True)

df = df_works.merge(df_exp_agg, on='work_id', how='left')
df['agg_disbursed'] = df['agg_disbursed'].fillna(0)
df['amount_disbursed_db'] = df['amount_disbursed'].fillna(0)

df['diff'] = abs(df['amount_disbursed_db'] - df['agg_disbursed'])
inconsistent = df[df['diff'] > 0.01]

print(f'\nTotal works: {len(df_works)}')
print(f'Works with DB amount_disbursed != sum(expenditures): {len(inconsistent)}')

if len(inconsistent) > 0:
    print('\nExamples of inconsistency:')
    print(inconsistent[['work_id', 'amount_disbursed_db', 'agg_disbursed']].head(10))

    # Also check how many have amount_disbursed == 0 but agg_disbursed > 0
    zero_db = inconsistent[inconsistent['amount_disbursed_db'] == 0]
    print(f'\nWorks with DB amount_disbursed = 0 but sum(expenditures) > 0: {len(zero_db)}')
