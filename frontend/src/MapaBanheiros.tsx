import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';

// Estilos obrigatórios
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// --- 1. FUNÇÃO PARA ÍCONE INDIVIDUAL COM NÚMERO ---
const criarIconeCustomizado = (status: string, quantidade: number) => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        <img src="https://cdn-icons-png.flaticon.com/512/1760/1760418.png" 
             style="width: 40px; height: 40px; filter: ${status === 'Crítico' ? 'hue-rotate(140deg) brightness(0.8) saturate(5)' : 'hue-rotate(260deg) brightness(1.2) saturate(2)'};" />
        <div style="position: absolute; top: -5px; right: -5px; background: ${status === 'Crítico' ? '#dc2626' : '#16a34a'}; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white;">
          ${quantidade}
        </div>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// --- 2. FUNÇÃO PARA ÍCONE DO CLUSTER (SOMA) ---
const createClusterCustomIcon = (cluster: any) => {
  const markers = cluster.getAllChildMarkers();
  let total = 0;
  markers.forEach((m: any) => {
    total += m.options.quantidadeBanheiro || 1;
  });

  return L.divIcon({
    html: `<div style="background: #1e40af; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);">
            ${total}
          </div>`,
    className: '',
    iconSize: L.point(40, 40, true),
  });
};

// --- 3. MONITOR DE LIMITES (COM CORREÇÃO DE ERRO) ---
const MonitorDeLimites = ({ aoMudarLimites, dados }: { aoMudarLimites: (ids: string[]) => void, dados: any[] }) => {
  const map = useMapEvents({
    moveend: () => {
      const limites = map.getBounds();
      
      // ADICIONADO: Filtro de segurança para garantir que coordenadas e lat/lng existam
      const visiveis = dados
        .filter(b => 
          b.coordenadas && 
          typeof b.coordenadas.lat === 'number' && 
          typeof b.coordenadas.lng === 'number' &&
          limites.contains([b.coordenadas.lat, b.coordenadas.lng])
        )
        .map(b => b.numero_os);
        
      aoMudarLimites(visiveis);
    },
  });

  useEffect(() => {
    // Só dispara se houver dados para evitar erro no carregamento inicial
    if (dados && dados.length > 0) {
      map.fire('moveend');
    }
  }, [dados]);

  return null;
};

interface MapaProps {
  dados: any[];
  onFiltrarVisiveis: (ids: string[]) => void;
}

const MapaBanheiros: React.FC<MapaProps> = ({ dados, onFiltrarVisiveis }) => {
  const [agrupar, setAgrupar] = useState(true);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [rotaSequencia, setRotaSequencia] = useState<any[]>([]);

  const toggleBanheiroNaRota = (banheiro: any) => {
    const idAtual = banheiro._id || banheiro.numero_os;
    const index = rotaSequencia.findIndex(p => p.id === idAtual);
    if (index !== -1) {
      const nova = [...rotaSequencia]; nova.splice(index, 1); setRotaSequencia(nova);
    } else {
      setRotaSequencia([...rotaSequencia, { 
        id: idAtual, 
        coords: [banheiro.coordenadas.lat, banheiro.coordenadas.lng] 
      }]);
    }
  };

  const renderMarkers = () => dados.map((b) => {
    // Verificação de segurança também na renderização
    if (!b.coordenadas || typeof b.coordenadas.lat !== 'number') return null;
    
    const qtd = b.quantidade || (parseInt(b.numero_os) % 3) + 1;
    return (
      <Marker 
        key={b.numero_os} 
        position={[b.coordenadas.lat, b.coordenadas.lng]}
        icon={criarIconeCustomizado(b.status, qtd)}
        quantidadeBanheiro={qtd}
        eventHandlers={{ click: () => { if(modoSelecao) toggleBanheiroNaRota(b) } }}
      >
        <Popup><strong>{b.localizacao}</strong><br/>Quantidade: {qtd}</Popup>
      </Marker>
    );
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setAgrupar(!agrupar)}
          style={{ padding: '8px 12px', background: 'white', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
        >
          {agrupar ? '🟢 Agrupamento ON' : '⚪ Agrupamento OFF'}
        </button>

        {!modoSelecao ? (
          <button 
            onClick={() => setModoSelecao(true)}
            style={{ padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            ➕ Nova Rota
          </button>
        ) : (
          <button 
            onClick={() => { console.log("ROTA:", rotaSequencia); setModoSelecao(false); setRotaSequencia([]); }}
            style={{ padding: '8px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            🚀 Finalizar Rota
          </button>
        )}
      </div>

      <MapContainer center={[-23.5505, -46.6333]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <MonitorDeLimites aoMudarLimites={onFiltrarVisiveis} dados={dados} />

        {agrupar ? (
          <MarkerClusterGroup iconCreateFunction={createClusterCustomIcon} showCoverageOnHover={false}>
            {renderMarkers()}
          </MarkerClusterGroup>
        ) : (
          renderMarkers()
        )}

        {rotaSequencia.length > 1 && (
          <Polyline positions={rotaSequencia.map(p => p.coords)} color="#2563eb" dashArray="10, 10" />
        )}
      </MapContainer>
    </div>
  );
};

export default MapaBanheiros;