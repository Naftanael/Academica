// scripts/seed.cjs

const { initializeApp, getApps, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp({
    credential: applicationDefault(),
  });
}

const adminApp = getAdminApp();
const db = getFirestore(adminApp);

const classroomsData = [
  { id: 'CR001', name: 'Sala 101', capacity: 30, building: 'Bloco A' },
  { id: 'CR002', name: 'Sala 102', capacity: 25, building: 'Bloco A' },
  { id: 'CR003', name: 'Laboratório de Química', capacity: 20, building: 'Bloco B' },
  { id: 'CR004', name: 'Auditório', capacity: 150, building: 'Bloco C' },
  { id: 'CR005', name: 'Sala 205', capacity: 35, building: 'Bloco B' },
];

const classGroupsData = [
  {
    id: 'CG01',
    name: 'Cálculo I',
    teacher: 'Prof. Dr. João Silva',
    weekday: 'Segunda-feira',
    startTime: '08:00',
    endTime: '10:00',
    classroom: 'CR001',
  },
  {
    id: 'CG02',
    name: 'Física Experimental',
    teacher: 'Profa. Dra. Maria Souza',
    weekday: 'Terça-feira',
    startTime: '14:00',
    endTime: '16:00',
    classroom: 'CR003',
  },
  {
    id: 'CG03',
    name: 'Introdução à Programação',
    teacher: 'Prof. Me. Carlos Lima',
    weekday: 'Quarta-feira',
    startTime: '10:00',
    endTime: '12:00',
    classroom: 'CR002',
  },
  {
    id: 'CG04',
    name: 'Literatura Clássica',
    teacher: 'Profa. Dra. Ana Costa',
    weekday: 'Sexta-feira',
    startTime: '19:00',
    endTime: '21:00',
    classroom: 'CR005',
  },
];

async function seedDatabase() {
  console.log('🔥 Iniciando o povoamento do banco de dados...');

  const classroomPromises = classroomsData.map(async (classroom) => {
    const docRef = db.collection('classrooms').doc(classroom.id);
    await docRef.set({
        ...classroom,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    console.log(`✅ Sala de aula adicionada: ${classroom.name} (ID: ${classroom.id})`);
  });

  const classGroupPromises = classGroupsData.map(async (group) => {
    const docRef = db.collection('classgroups').doc(group.id);
    await docRef.set({
        ...group,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    console.log(`✅ Turma adicionada: ${group.name} (ID: ${group.id})`);
  });

  await Promise.all([...classroomPromises, ...classGroupPromises]);

  console.log('🎉 Povoamento do banco de dados concluído com sucesso!');
}

seedDatabase().catch((error) => {
  console.error('❌ Erro ao executar o script de povoamento:', error);
  process.exit(1);
});
