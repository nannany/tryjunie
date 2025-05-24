# supabase

## supabase start

`supabase start`を実行すると、ローカルに環境が作られる。

todo: どんな環境？

## supabase login

`supabase login`コマンドを実行すると、browser が立ち上がって supabase へのログインが促される。
これで cli 上でもログインした状態となる。

## supabase link

`supabase link`コマンドを実行すると、supabase の project と、現在の cli の向き先を結びつけられる。

## supabase migration up

`supabase migration up`を実行すると、ローカルの db に反映される。

## supabase migration list

`supabase migration list`を実行すると、どの環境に反映されてるかわかる。

本番環境のパスワードを要求されるので、SUPABASE_DB_PASSWORD 環境変数に値を入れておく。

## supabase db push

`supabase db push`を実行すると、supabase の本番環境に`/supabase/migrations`配下の ddl が反映される。

---

# supabase functions deploy

本番環境に supabase functions をデプロイする。
