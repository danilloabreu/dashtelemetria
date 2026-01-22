import React, { useState, useEffect } from 'react';
import MapaBanheiros from './MapaBanheiros';

// --- ESTILOS DA TABELA ---
const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: '#f1f5f9',
  color: '#475569',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '2px solid #e2e8f0',
  textAlign: 'left'
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '14px',
  color: '#1e293b',
  borderBottom: '1px solid #f1f5f9'
};

// --- COMPONENTES AUXILIARES DE INTERFACE ---
const StatusBadge = ({ status }: { status: string }) => {
  const isCritico = status === 'Crítico';
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: isCritico ? '#fef2f2' : '#f0fdf4',
      color: isCritico ? '#dc2626' : '#16a34a',
      border: `1px solid ${isCritico ? '#fecaca' : '#bbf7d0'}`,
      display: 'inline-block'
    }}>
      {status}
    </span>
  );
};

const LevelBar = ({ valor }: { valor: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{ width: '80px', background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
      <div style={{ 
        width: `${valor}%`, 
        background: valor < 30 ? '#ef4444' : '#22c55e', 
        height: '100%',
        transition: 'width 0.5s ease'
      }} />
    </div>
    <span style={{ fontSize: '11px', color: '#64748b', minWidth: '25px' }}>{valor}%</span>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [banheiros, setBanheiros] = useState<any[]>([]);
  const [idsVisiveis, setIdsVisiveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/ordens')
      .then(res => res.json())
      .then(dados => {
        setBanheiros(dados);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar dados:", err);
        setLoading(false);
      });
  }, []);

  // Filtra os dados com base no que o MonitorDeLimites do Mapa detecta
  const banheirosNaTela = banheiros.filter(b => idsVisiveis.includes(b.numero_os));

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <p>Carregando sistema de telemetria...</p>
    </div>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ 
        height: '60px', 
        background: '#1e40af', 
        color: 'white', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🚽</span>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>SmartToilet Fleet Control</h2>
        </div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>
          Unidades Visíveis: <strong>{banheirosNaTela.length}</strong>
        </div>
      </header>

      {/* ÁREA DO MAPA */}
      <div style={{ height: '55%', width: '100%', position: 'relative', borderBottom: '1px solid #e2e8f0' }}>
        <MapaBanheiros dados={banheiros} onFiltrarVisiveis={setIdsVisiveis} />
      </div>

      {/* ÁREA DA TABELA */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>OS</th>
                <th style={thStyle}>Localização</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Suprimentos (Papel)</th>
                <th style={thStyle}>Fluxo</th>
              </tr>
            </thead>
            <tbody>
              {banheirosNaTela.length > 0 ? (
                banheirosNaTela.map((b, index) => (
                  <tr key={b.numero_os} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#2563eb' }}>#{b.numero_os}</td>
                    <td style={tdStyle}>{b.localizacao}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={tdStyle}>
                      <LevelBar valor={b.sensores?.nivel_papel || 0} />
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600 }}>{b.sensores?.fluxo_pessoas || 0}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>usuários</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Nenhuma unidade visível na área selecionada do mapa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}