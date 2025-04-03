# supabase 

## supabase start

`supabase start`を実行すると、ローカルに環境が作られる。

todo: どんな環境？

## supabase login

`supabase login`コマンドを実行すると、browserが立ち上がってsupabaseへのログインが促される。
これでcli上でもログインした状態となる。

## supabase link

`supabase link`コマンドを実行すると、supabaseのprojectと、現在のcliの向き先を結びつけられる。

## supabase migration up

`supabase migration up`を実行すると、ローカルのdbに反映される。

## supabase migration list 
`supabase migration list`を実行すると、どの環境に反映されてるかわかる。

本番環境のパスワードを要求されるので、SUPABASE_DB_PASSWORD環境変数に値を入れておく。


## supabase db push 

`supabase db push`を実行すると、supabaseの本番環境に`/supabase/migrations`配下のddlが反映される。

