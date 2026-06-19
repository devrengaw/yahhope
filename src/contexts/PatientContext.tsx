import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, ClinicalEvent } from '../lib/mockData';
import { supabase } from '../lib/supabase';

interface PatientContextType {
  patients: Patient[];
  events: ClinicalEvent[];
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addEvent: (event: ClinicalEvent) => void;
  updateEvent: (id: string, updates: Partial<ClinicalEvent>) => void;
  deletePatient: (id: string) => void;
  addFullPatientRecord: (payload: any) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [events, setEvents] = useState<ClinicalEvent[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: childrenData } = await supabase.from('children').select(`
        *,
        caregivers (name)
      `);
      
      const { data: eventsData } = await supabase.from('clinical_events').select('*');

      if (childrenData) {
        const formattedPatients: Patient[] = childrenData.map(c => {
          const guardian = c.caregivers && c.caregivers.length > 0 ? c.caregivers[0].name : 'Não informado';
          
          // Get latest nutritional status from events
          let status = 'Adequado';
          if (eventsData) {
            const childEvents = eventsData.filter(e => e.child_id === c.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (childEvents.length > 0 && childEvents[0].nutritional_status) {
              status = childEvents[0].nutritional_status;
            }
          }

          return {
            id: c.id,
            registration_number: c.registration_number || '',
            name: c.name,
            dob: c.dob,
            gender: c.gender as any,
            status: status as any,
            community: c.address || '',
            created_at: c.created_at,
            guardian_name: guardian,
            housing_type: '',
            sanitation: ''
          };
        });
        setPatients(formattedPatients);
      }

      if (eventsData) {
        const formattedEvents: ClinicalEvent[] = eventsData.map(e => ({
          id: e.id,
          patient_id: e.child_id,
          event_type: e.event_type as any,
          date: e.date,
          notes: e.notes || '',
          weight: e.weight,
          height: e.height,
          muac: e.muac,
          head_circumference: e.head_circumference,
          bmi: e.bmi,
          z_score_weight_height: e.z_score_weight_height,
          nutritional_status: e.nutritional_status,
          prescriptions: e.prescriptions || [],
          professional: e.professional_id || 'Profissional',
          return_date: e.return_date,
          kit_delivered: [],
          hospital_referral: false,
          is_discharge: false
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Error fetching patients', err);
    }
  };

  const addPatient = async (patient: Omit<Patient, 'id'> | Patient) => {
    // Generate an optimistic ID if none provided
    const tempId = (patient as Patient).id || Math.random().toString();
    
    // Optistic update
    const optimisticPatient: Patient = { ...patient, id: tempId } as Patient;
    setPatients(prev => [optimisticPatient, ...prev]);

    try {
      const { data: newChild } = await supabase.from('children').insert({
        registration_number: patient.registration_number,
        name: patient.name,
        dob: patient.dob,
        gender: patient.gender,
        address: patient.community,
        color: ''
      }).select().single();

      if (newChild) {
        if (patient.guardian_name) {
          await supabase.from('caregivers').insert({
            child_id: newChild.id,
            name: patient.guardian_name
          });
        }
        
        // Update state with real DB ID
        setPatients(prev => prev.map(p => p.id === tempId ? { ...p, id: newChild.id } : p));
      }
    } catch (e) {
      console.error('Add patient error', e);
      fetchData(); // rollback
      throw e;
    }
  };

  const addFullPatientRecord = async (payload: any) => {
    // 1. Insert child
    const { data: newChild, error: childError } = await supabase.from('children').insert({
      registration_number: payload.registration_number,
      name: payload.name,
      birthplace: payload.birthplace,
      province: payload.province,
      origin: payload.origin,
      address: payload.address || payload.city,
      city: payload.city,
      dob: payload.dob,
      gender: payload.gender,
      color: payload.color
    }).select().single();

    if (childError) throw childError;
    const childId = newChild.id;

    // 2. Insert caregiver
    if (payload.caregiver_name) {
      const { error: cgError } = await supabase.from('caregivers').insert({
        child_id: childId,
        name: payload.caregiver_name,
        marital_status: payload.marital_status,
        education: payload.education,
        religion: payload.religion
      });
      if (cgError) throw cgError;
    }

    // 3. Insert social triage
    const { data: st, error: stError } = await supabase.from('social_triage').insert({
      child_id: childId,
      date: payload.service_date || new Date().toISOString().split('T')[0]
    }).select().single();
    
    if (!stError && st) {
      const stId = st.id;
      
      // 4. Household Conditions
      await supabase.from('household_conditions').insert({
        social_triage_id: stId,
        housing_type: payload.housing_type,
        rooms: payload.rooms ? parseInt(payload.rooms) : null,
        dwelling_type: payload.dwelling_type,
        roof: payload.roof,
        sanitation: payload.sanitation,
        sewage: payload.sewage,
        garbage: payload.garbage,
        animals: payload.animals
      });

      // 5. Socioeconomics
      await supabase.from('socioeconomics').insert({
        social_triage_id: stId,
        monthly_income: payload.monthly_income ? parseFloat(payload.monthly_income) : null,
        father_job: payload.father_job,
        mother_job: payload.mother_job,
        caregiver_job: payload.caregiver_job,
        observations: payload.social_observations
      });

      // 6. Dependents
      if (payload.dependents && payload.dependents.length > 0) {
        for (const dep of payload.dependents) {
          if (dep.name) {
            await supabase.from('dependents').insert({
              social_triage_id: stId,
              name: dep.name,
              dob: dep.dob || null,
              weight: dep.weight ? parseFloat(dep.weight) : null,
              height: dep.height ? parseFloat(dep.height) : null,
              muac: dep.muac ? parseFloat(dep.muac) : null
            });
          }
        }
      }
    }

    // 7. Initial Assessments
    const { data: ia, error: iaError } = await supabase.from('initial_assessments').insert({
      child_id: childId,
      date: payload.service_date || new Date().toISOString().split('T')[0],
      informant: payload.informant,
      main_complaint: payload.main_complaint,
      history: payload.history,
      current_medications: payload.current_medications
    }).select().single();

    if (!iaError && ia) {
      const iaId = ia.id;

      await supabase.from('gestational_history').insert({
        assessment_id: iaId,
        prenatal_problems: payload.prenatal_problems,
        prenatal_consultations: payload.prenatal_consultations ? parseInt(payload.prenatal_consultations) : null,
        delivery_type: payload.delivery_type,
        gestational_age: payload.gestational_age ? parseInt(payload.gestational_age) : null,
        apgar_1: payload.apgar_1 ? parseInt(payload.apgar_1) : null,
        apgar_5: payload.apgar_5 ? parseInt(payload.apgar_5) : null,
        birth_weight: payload.birth_weight ? parseFloat(payload.birth_weight) : null,
        birth_height: payload.birth_height ? parseFloat(payload.birth_height) : null,
        birth_hc: payload.birth_hc ? parseFloat(payload.birth_hc) : null,
        birth_tc: payload.birth_tc ? parseFloat(payload.birth_tc) : null,
        birth_problems: payload.birth_problems
      });

      await supabase.from('feeding_history').insert({
        assessment_id: iaId,
        breast_milk: payload.breast_milk === 'Sim',
        exclusive_breast_milk_until: payload.exclusive_breast_milk_until,
        weaning_age: payload.weaning_age,
        water_tea_intro: payload.water_tea_intro,
        cow_milk_intro: payload.cow_milk_intro,
        salty_mush_intro: payload.salty_mush_intro,
        juice_intro: payload.juice_intro,
        soup_intro: payload.soup_intro,
        other_foods: payload.other_foods,
        current_feeding: payload.current_feeding
      });

      await supabase.from('clinical_history').insert({
        assessment_id: iaId,
        supplements: payload.supplements,
        previous_diseases: payload.previous_diseases,
        mother_history: payload.mother_history,
        father_history: payload.father_history,
        other_relatives_history: payload.other_relatives_history,
        family_malnutrition_history: payload.family_malnutrition_history,
        consanguinity: payload.consanguinity === 'Sim',
        hereditary_diseases: payload.hereditary_diseases,
        family_dynamics: payload.family_dynamics,
        immunization: payload.immunization
      });

      await supabase.from('physical_exam').insert({
        assessment_id: iaId,
        weight: payload.weight ? parseFloat(payload.weight) : null,
        height: payload.height ? parseFloat(payload.height) : null,
        z_score_height_age: payload.z_score_height_age ? parseFloat(payload.z_score_height_age) : null,
        z_score_weight_height: payload.z_score_weight_height ? parseFloat(payload.z_score_weight_height) : null,
        head_circumference: payload.head_circumference ? parseFloat(payload.head_circumference) : null,
        muac: payload.muac ? parseFloat(payload.muac) : null,
        bmi: payload.bmi ? parseFloat(payload.bmi) : null,
        bmi_gestational: payload.bmi_gestational ? parseFloat(payload.bmi_gestational) : null,
        bilateral_edema: payload.bilateral_edema,
        axillary_temperature: payload.axillary_temperature ? parseFloat(payload.axillary_temperature) : null,
        clinical_signs: payload.clinicalSigns || [],
        oral_health: payload.oral_health,
        other_findings: payload.other_findings
      });

      await supabase.from('nutritional_evaluation').insert({
        assessment_id: iaId,
        evaluation: payload.nutritionalEval || []
      });
    }

    // 8. Clinical Event (CRITICAL for Dashboard)
    const status = (payload.nutritionalEval?.length > 0 ? (payload.nutritionalEval.includes('Desnutrição aguda grave com complicações') || payload.nutritionalEval.includes('Desnutrição aguda grave sem complicações') ? 'DAG' : (payload.nutritionalEval.includes('Desnutrição aguda moderada (DAM)') ? 'DAM' : 'Adequado')) : 'Adequado');

    const { error: eventError } = await supabase.from('clinical_events').insert({
      child_id: childId,
      event_type: 'initial',
      date: payload.service_date || new Date().toISOString().split('T')[0],
      weight: payload.weight ? parseFloat(payload.weight) : null,
      height: payload.height ? parseFloat(payload.height) : null,
      muac: payload.muac ? parseFloat(payload.muac) : null,
      head_circumference: payload.head_circumference ? parseFloat(payload.head_circumference) : null,
      bmi: payload.bmi ? parseFloat(payload.bmi) : null,
      z_score_weight_height: payload.z_score_weight_height ? parseFloat(payload.z_score_weight_height) : null,
      nutritional_status: status,
      notes: payload.other_findings || 'Consulta Inicial',
      return_date: payload.return_date || null
    });

    if (eventError) throw eventError;

    // Refresh data
    await fetchData();
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    
    if (id.length > 10) { // Valid UUID rough check
      await supabase.from('children').update({
        registration_number: updates.registration_number,
        name: updates.name,
        dob: updates.dob,
        gender: updates.gender,
        address: updates.community
      }).eq('id', id);
    }
  };

  const addEvent = async (event: ClinicalEvent) => {
    const tempId = event.id || Math.random().toString();
    setEvents(prev => [{ ...event, id: tempId }, ...prev]);

    if (event.patient_id.length > 10) {
      const { data: newEvent } = await supabase.from('clinical_events').insert({
        child_id: event.patient_id,
        event_type: event.event_type,
        date: event.date,
        notes: event.notes,
        weight: event.weight,
        height: event.height,
        muac: event.muac,
        head_circumference: event.head_circumference,
        bmi: event.bmi,
        z_score_weight_height: event.z_score_weight_height,
        nutritional_status: event.nutritional_status,
        prescriptions: event.prescriptions || null,
        return_date: event.return_date || null
      }).select().single();

      if (newEvent) {
        setEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: newEvent.id } : e));
      }
    }
  };

  const updateEvent = async (id: string, updates: Partial<ClinicalEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (id.length > 10) {
      await supabase.from('clinical_events').update({
        notes: updates.notes,
        weight: updates.weight,
        height: updates.height,
        nutritional_status: updates.nutritional_status
      }).eq('id', id);
    }
  };

  const deletePatient = async (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
    setEvents(prev => prev.filter(e => e.patient_id !== id));
    if (id.length > 10) {
      await supabase.from('children').delete().eq('id', id);
    }
  };

  return (
    <PatientContext.Provider value={{ 
      patients, 
      events, 
      addPatient, 
      addFullPatientRecord,
      updatePatient, 
      addEvent, 
      updateEvent,
      deletePatient 
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
