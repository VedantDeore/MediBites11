// 'use client'
// import React, { useState, useEffect } from 'react'
// import { useTheme } from 'next-themes'
// import { 
//   BarChart, 
//   Users, 
//   FileText, 
//   Brain, 
//   Search,
//   Filter,
//   Download,
//   Database,
//   Microscope,
//   ClipboardList,
//   Network,
//   LineChart,
//   BookOpen,
//   Flask,
//   Settings,
//   LogOut,
//   Share2,
//   FileBarChart
// } from 'lucide-react'

// // Sidebar component
// const Sidebar = () => {
//   const { theme } = useTheme()
//   const [mounted] = useState(true)

//   if (!mounted) return null

//   const menuItems = [
//     { 
//       icon: Database, 
//       label: 'Data Repository', 
//       active: true,
//       description: 'Access patient data and research datasets'
//     },
//     { 
//       icon: Microscope, 
//       label: 'Active Studies',
//       description: 'Manage ongoing research studies' 
//     },
//     { 
//       icon: Brain, 
//       label: 'AI Analysis',
//       description: 'AI-powered data analysis tools' 
//     },
//     { 
//       icon: ClipboardList, 
//       label: 'Study Protocols',
//       description: 'Research protocols and methodologies' 
//     },
//     { 
//       icon: Network, 
//       label: 'Collaborations',
//       description: 'Partner institutions and joint studies' 
//     },
//     { 
//       icon: LineChart, 
//       label: 'Analytics',
//       description: 'Research metrics and insights' 
//     },
//     { 
//       icon: BookOpen, 
//       label: 'Publications',
//       description: 'Research papers and findings' 
//     },
//     { 
//       icon: Share2, 
//       label: 'Data Sharing',
//       description: 'Secure data exchange protocols' 
//     },
//     { 
//       icon: FileBarChart, 
//       label: 'Reports',
//       description: 'Generate research reports' 
//     },
//     { 
//       icon: Flask, 
//       label: 'Lab Integration',
//       description: 'Connect with laboratory systems' 
//     },
//     { 
//       icon: Settings, 
//       label: 'Settings',
//       description: 'Research portal preferences' 
//     }
//   ]

//   return (
//     <div className={`fixed left-0 top-0 h-full w-64 ${
//       theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
//     } border-r overflow-y-auto`}>
//       {/* Logo */}
//       <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200">
//         <div className="text-blue-600">
//           <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
//             <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
//           </svg>
//         </div>
//         <div>
//           <span className="text-xl font-semibold">MediCare</span>
//           <div className="text-xs text-gray-500">Research Portal</div>
//         </div>
//       </div>

//       {/* Menu Items */}
//       <nav className="mt-6">
//         {menuItems.map((item, index) => (
//           <a
//             key={index}
//             href="#"
//             className={`flex items-center gap-4 px-6 py-3 text-sm group relative ${
//               item.active
//                 ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
//                 : 'text-gray-600 hover:bg-gray-50'
//             }`}
//           >
//             <item.icon className="w-5 h-5" />
//             <span>{item.label}</span>
            
//             {/* Tooltip */}
//             <div className="absolute left-full ml-2 invisible group-hover:visible bg-gray-800 text-white text-xs py-1 px-2 rounded w-48 z-50">
//               {item.description}
//             </div>
//           </a>
//         ))}
//       </nav>

//       {/* Institution Profile */}
//       <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
//         <div className="flex items-center gap-4 p-4">
//           <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
//             <Microscope className="w-5 h-5 text-blue-600" />
//           </div>
//           <div className="flex-1">
//             <h4 className="text-sm font-medium">Research Institute</h4>
//             <p className="text-xs text-gray-500">ID: RI-2024-001</p>
//           </div>
//           <button className="p-2 text-gray-400 hover:text-gray-600" title="Sign Out">
//             <LogOut className="w-5 h-5" />
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// const InstitutionDashboard = () => {
//   const { theme, setTheme } = useTheme()
//   const [mounted, setMounted] = useState(false)

//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   const [selectedFilter, setSelectedFilter] = useState('all')

//   // Dummy data - Replace with actual data from your backend
//   const stats = [
//     { title: 'Total Patients', value: '15,342', icon: Users, change: '+12%' },
//     { title: 'Research Papers', value: '284', icon: FileText, change: '+5%' },
//     { title: 'Active Studies', value: '46', icon: Brain, change: '+8%' },
//     { title: 'Data Points', value: '1.2M', icon: BarChart, change: '+15%' },
//   ]

//   const recentStudies = [
//     { id: 1, title: 'Neurological Response Patterns', participants: 234, status: 'Active' },
//     { id: 2, title: 'Cardiovascular Health Study', participants: 567, status: 'Active' },
//     { id: 3, title: 'Genetic Markers Research', participants: 789, status: 'Pending' },
//     { id: 4, title: 'Mental Health Patterns', participants: 432, status: 'Completed' },
//   ]

//   // Early return with a simple loading state
//   if (!mounted) {
//     return (
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
//         <div className="animate-pulse">Loading...</div>
//       </div>
//     )
//   }

//   return (
//     <div className={`min-h-screen ${
//       theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
//     } flex`}>
//       <Sidebar />
//       <div className="flex-1 ml-64">
//         {/* Header */}
//         <div className={`${
//           theme === 'dark' ? 'bg-gray-800' : 'bg-white'
//         } shadow`}>
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//             <h1 className={`text-3xl font-bold ${
//               theme === 'dark' ? 'text-white' : 'text-gray-900'
//             }`}>Research Institution Dashboard</h1>
//             <p className={`mt-1 text-sm ${
//               theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
//             }`}>Access and analyze patient data for research purposes</p>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           {/* Stats Grid */}
//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//             {stats.map((stat) => (
//               <div key={stat.title} className={`${
//                 theme === 'dark' ? 'bg-gray-800' : 'bg-white'
//               } overflow-hidden shadow rounded-lg`}>
//                 <div className="p-5">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0">
//                       <stat.icon className="h-6 w-6 text-gray-400" />
//                     </div>
//                     <div className="ml-5 w-0 flex-1">
//                       <dl>
//                         <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
//                         <dd className="flex items-baseline">
//                           <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
//                           <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
//                             {stat.change}
//                           </div>
//                         </dd>
//                       </dl>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Search and Filter Section */}
//           <div className="mt-8 bg-white shadow rounded-lg p-6">
//             <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
//               <div className="relative flex-1 max-w-lg">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Search className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//                   placeholder="Search patient records, studies, or research papers..."
//                 />
//               </div>
//               <div className="flex items-center space-x-4">
//                 <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
//                   <Filter className="h-4 w-4 mr-2" />
//                   Filter
//                 </button>
//                 <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
//                   <Download className="h-4 w-4 mr-2" />
//                   Export Data
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Recent Studies Table */}
//           <div className="mt-8 bg-white shadow rounded-lg">
//             <div className="px-6 py-5 border-b border-gray-200">
//               <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Studies</h3>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Study Name</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {recentStudies.map((study) => (
//                     <tr key={study.id}>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{study.title}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{study.participants}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                           study.status === 'Active' ? 'bg-green-100 text-green-800' :
//                           study.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
//                           'bg-gray-100 text-gray-800'
//                         }`}>
//                           {study.status}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         <button className="text-blue-600 hover:text-blue-900">View Details</button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default InstitutionDashboard
