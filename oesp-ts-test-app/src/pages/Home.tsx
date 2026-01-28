import { Link } from 'react-router-dom';
import { Bluetooth, Package, FileText, Activity, ArrowRight, Wifi } from 'lucide-react';

const modules = [
  {
    title: 'Connexion BLE',
    description: 'Scanner et se connecter aux périphériques Bluetooth Low Energy',
    icon: Bluetooth,
    color: 'blue',
    path: '/connection'
  },
  {
    title: 'Connexion Sync (QR)',
    description: 'Scanner un QR code pour se connecter via Internet',
    icon: Wifi,
    color: 'indigo',
    path: '/sync'
  },
  {
    title: 'Encodage de Packages',
    description: 'Créer et encoder des packages selon le protocole oesp-ts',
    icon: Package,
    color: 'green',
    path: '/encoding'
  },
  {
    title: 'Décodage de Packages',
    description: 'Analyser et décoder les packages binaires reçus',
    icon: FileText,
    color: 'purple',
    path: '/decoding'
  },
  {
    title: 'Transfert de Données',
    description: 'Monitorer les transferts de données en temps réel',
    icon: Activity,
    color: 'orange',
    path: '/transfer'
  }
];

const getColorClasses = (color: string) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100',
    green: 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100',
    orange: 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100'
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

const getIconColor = (color: string) => {
  const colors = {
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OESP-TS Test Application
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Application web de test pour valider les modules oesp-ts : connexion BLE, 
            encodage/décodage de packages et transfert de données.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Bluetooth className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Web Bluetooth API</h3>
            <p className="text-sm text-gray-600">Scan et connexion aux périphériques BLE</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Wifi className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Sync QR Code</h3>
            <p className="text-sm text-gray-600">Scan QR Code pour connexion inter-appareils</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Encodage/Décodage</h3>
            <p className="text-sm text-gray-600">Validation des formats de packages</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Analyse Binaire</h3>
            <p className="text-sm text-gray-600">Visualisation structurée des données</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Monitoring Temps Réel</h3>
            <p className="text-sm text-gray-600">Statistiques de transfert en direct</p>
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Modules de Test
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Link
                  key={index}
                  to={module.path}
                  className={`block rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${getColorClasses(module.color)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <Icon className={`w-8 h-8 mr-3 ${getIconColor(module.color)}`} />
                        <h3 className="text-xl font-bold">{module.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {module.description}
                      </p>
                      <div className="flex items-center text-sm font-medium">
                        <span>Ouvrir le module</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-yellow-900 font-bold text-sm">!</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-yellow-900 mb-2">
                Configuration requise
              </h3>
              <p className="text-yellow-800">
                Cette application nécessite une connexion HTTPS (ou localhost) pour accéder à l'API Web Bluetooth. 
                Assurez-vous d'utiliser un navigateur moderne compatible avec Web Bluetooth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}