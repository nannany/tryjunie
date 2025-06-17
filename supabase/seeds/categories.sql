-- マスターデータの初期データ投入
insert into public.categories (name, color, description)
values ('仕事', '#3b82f6', '業務関連のタスク'),
       ('個人', '#10b981', '個人的なタスク'),
       ('学習', '#8b5cf6', '学習・スキルアップ関連'),
       ('健康', '#ef4444', '健康・運動関連'),
       ('家事', '#f59e0b', '家事・生活関連'),
       ('その他', '#6b7280', 'その他のタスク')
on conflict (name) do nothing;
