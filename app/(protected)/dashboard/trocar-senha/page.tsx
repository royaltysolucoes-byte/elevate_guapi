'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrocarSenhaPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: formData.newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erro ao alterar senha');
        setLoading(false);
        return;
      }

      setSuccess('Senha alterada com sucesso!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Trocar Senha</h1>

      <div className="bg-[#282c34] rounded-lg shadow-md p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-500 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-[#363f4a] text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
              required
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

