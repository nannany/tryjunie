import { useState, useEffect } from 'react';
import { PlusCircle, Trash2, RefreshCw, Copy, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { generateApiKey, formatJapaneseDate } from '@/lib/integration-key-utils';
import type { IntegrationKey } from '@/types/integration-key';

const supabase = createClient();

const IntegrationKeysPage = () => {
  const [keys, setKeys] = useState<IntegrationKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // インテグレーションキーを取得する
  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('integration_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: `インテグレーションキーの取得に失敗しました: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 初回ロード時にキーを取得
  useEffect(() => {
    fetchKeys();
  }, []);

  // 新しいキーを生成する
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'キー名を入力してください',
      });
      return;
    }

    setIsCreating(true);
    try {
      // セキュアなAPIキーを生成
      const keyString = generateApiKey(40);

      const { error } = await supabase
        .from('integration_keys')
        .insert({
          name: newKeyName.trim(),
          key: keyString,
        });

      if (error) throw error;

      toast({
        title: '成功',
        description: 'インテグレーションキーが生成されました',
      });

      setNewKeyName('');
      await fetchKeys();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: `キーの生成に失敗しました: ${error.message}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // キーを無効化する
  const handleDeactivateKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('integration_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: '成功',
        description: 'インテグレーションキーが無効化されました',
      });
      
      await fetchKeys();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: `キーの無効化に失敗しました: ${error.message}`,
      });
    }
  };

  // キーを削除する
  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('このインテグレーションキーを削除してもよろしいですか？この操作は元に戻せません。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('integration_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: '成功',
        description: 'インテグレーションキーが削除されました',
      });
      
      await fetchKeys();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: `キーの削除に失敗しました: ${error.message}`,
      });
    }
  };

  // キーをコピーする
  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    
    toast({
      title: 'コピーしました',
      description: 'インテグレーションキーがクリップボードにコピーされました',
    });
    
    // 3秒後にコピー状態をリセット
    setTimeout(() => {
      setCopiedKeyId(null);
    }, 3000);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">インテグレーションキー</h1>
        <p className="text-gray-600">
          インテグレーションキーを使用して、外部サービスやAPIからアプリケーションにアクセスできます。
          キーは安全に保管し、公開しないでください。
        </p>
      </div>

      {/* 新しいキーの作成フォーム */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>新しいインテグレーションキーを作成</CardTitle>
          <CardDescription>
            キーの名前を入力し、「キーを生成」ボタンをクリックしてください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateKey} className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="keyName" className="block text-sm font-medium mb-2">
                キー名 (用途など)
              </label>
              <Input
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="例: 開発用APIアクセス"
                required
              />
            </div>
            <Button type="submit" disabled={isCreating} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              {isCreating ? 'キー生成中...' : 'キーを生成'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* キー一覧 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>インテグレーションキー一覧</CardTitle>
            <CardDescription>
              生成したインテグレーションキーの一覧です。必要に応じて削除できます。
            </CardDescription>
          </div>
          <Button variant="outline" onClick={fetchKeys} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              インテグレーションキーがまだありません。新しいキーを生成してください。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">名前</th>
                    <th className="text-left py-3 px-4">キー</th>
                    <th className="text-left py-3 px-4">ステータス</th>
                    <th className="text-left py-3 px-4">作成日時</th>
                    <th className="text-left py-3 px-4">最終使用日時</th>
                    <th className="text-right py-3 px-4">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{key.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 p-1 rounded">
                            {key.key.substring(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(key.key, key.id)}
                            title="キーをコピー"
                            className="flex gap-1 items-center"
                          >
                            {copiedKeyId === key.id ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                コピー済み
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                コピー
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                            key.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {key.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              アクティブ
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              無効
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatJapaneseDate(key.created_at)}</td>
                      <td className="py-3 px-4">{formatJapaneseDate(key.last_used_at)}</td>
                      <td className="py-3 px-4 text-right">
                        {key.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateKey(key.id)}
                            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 mr-2"
                          >
                            無効化
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationKeysPage;
