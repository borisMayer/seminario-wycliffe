'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FileUploader } from '@/app/components/FileUploader'

const G = { gold: '#C9A84C', goldLight: '#E8C97A', goldDim: '#7a6230', ink: '#021A38', parchment: '#F5EDD8', green: '#4A9B7F', red: '#E05555', purple: '#7B6DB5', orange: '#C47A3A' }
const TYPE_ICON: Record<string,string> = { trabajo:'📝', examen:'📋', foro:'💬', proyecto:'🏛', quiz:'⚡' }
const TYPE_LABEL: Record<string,string> = { trabajo:'Trabajo escrito', examen:'Examen', foro:'Participación foro', proyecto:'Proyecto final', quiz:'Quiz' }
const scoreColor = (s:number) => s>=90?G.green:s>=70?G.gold:s>=50?G.orange:G.red
const scoreLabel = (s:number) => s>=90?'Excelente':s>=70?'Bueno':s>=50?'Suficiente':'Insuficiente'

type Course = { id:string; title:string; category:string; published:boolean; _count:{lessons:number;enrollments:number}; enrollments?:{user:{id:string;name:string|null;email:string;role:string}}[] }
type Assignment = { id:string; courseId:string; title:string; description:string|null; type:string; weight:number; dueDate:string|null; _count:{submissions:number;grades:number} }
type Grade = { id:string; assignmentId:string; userId:string; score:number; comment:string|null; gradedAt:string; assignment:{title:string;weight:number;course:{id:string;title:string;category:string}} }
type Submission = { id:string; assignmentId:string; fileUrl:string|null; content:string|null; submittedAt:string; feedback:string|null; feedbackAt:string|null; assignment:{title:string;type:string;weight:number}; user?:{id:string;name:string|null;email:string} }

const EMPTY_ASSIGN = { title:'', description:'', type:'trabajo', weight:'20', dueDate:'' }

// ─── STUDENT VIEW ───────────────────────────────────────────────
function StudentView() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string|null>(null)
  const [tab, setTab] = useState<'notas'|'tareas'>('notas')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submitForm, setSubmitForm] = useState<{assignmentId:string;fileUrl:string;content:string}|null>(null)
  const [toast, setToast] = useState('')
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000) }

  useEffect(()=>{
    fetch('/api/enrollments').then(r=>r.json()).then(enr=>{
      const c = enr.map((e:any)=>e.course)
      setCourses(c); if(c.length>0) setSelectedCourse(c[0].id)
    })
  },[])

  useEffect(()=>{
    if(!selectedCourse) return
    Promise.all([
      fetch(`/api/assignments?courseId=${selectedCourse}`).then(r=>r.json()),
      fetch(`/api/grades?courseId=${selectedCourse}`).then(r=>r.json()),
      fetch('/api/submissions').then(r=>r.json()),
    ]).then(([a,g,s])=>{
      setAssignments(Array.isArray(a)?a:[])
      setGrades(Array.isArray(g)?g:[])
      setSubmissions(Array.isArray(s)?s:[])
    })
  },[selectedCourse])

  const courseAssignments = assignments.filter(a=>a.courseId===selectedCourse)
  const myGrades = grades.filter(g=>g.assignment.course.id===selectedCourse)
  const totalWeight = courseAssignments.reduce((s,a)=>s+a.weight,0)
  const weightedAvg = myGrades.length>0 ? (() => {
    let ws=0,tw=0
    myGrades.forEach(g=>{ const a=courseAssignments.find(a=>a.id===g.assignmentId); if(a){ws+=g.score*(a.weight/100);tw+=a.weight/100} })
    return tw>0?Math.round((ws/tw)*10)/10:null
  })() : null

  return (
    <div style={{display:'flex',height:'calc(100vh - 53px)'}}>
      {toast && <div style={{position:'fixed',top:'1.5rem',right:'1.5rem',zIndex:100,background:'#1a1608',border:'1px solid rgba(201,168,76,0.5)',color:G.gold,padding:'0.75rem 1.5rem',borderRadius:'8px',fontSize:'0.85rem'}}>{toast}</div>}

      {/* Sidebar */}
      <aside style={{width:'220px',borderRight:'1px solid rgba(201,168,76,0.08)',flexShrink:0,overflowY:'auto'}}>
        <div style={{padding:'0.75rem',borderBottom:'1px solid rgba(201,168,76,0.08)'}}>
          {([['notas','📊 Notas'],['tareas','📬 Tareas']] as [string,string][]).map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id as any)}
              style={{width:'100%',textAlign:'left',padding:'0.55rem 0.75rem',marginBottom:'0.2rem',background:tab===id?'rgba(201,168,76,0.1)':'transparent',border:'none',borderRadius:'5px',borderLeft:`2px solid ${tab===id?G.gold:'transparent'}`,color:tab===id?G.gold:'rgba(245,237,216,0.45)',fontSize:'0.78rem',letterSpacing:'0.1em',cursor:'pointer',fontFamily:'Georgia, serif'}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{padding:'0.75rem'}}>
          <div style={{fontSize:'0.6rem',letterSpacing:'0.3em',color:G.goldDim,marginBottom:'0.5rem',paddingLeft:'0.5rem'}}>MIS CURSOS</div>
          {courses.map(c=>(
            <button key={c.id} onClick={()=>setSelectedCourse(c.id)}
              style={{width:'100%',textAlign:'left',padding:'0.55rem 0.75rem',marginBottom:'0.2rem',background:selectedCourse===c.id?'rgba(201,168,76,0.08)':'transparent',border:'none',borderRadius:'5px',borderLeft:`2px solid ${selectedCourse===c.id?G.gold:'transparent'}`,color:selectedCourse===c.id?G.parchment:'rgba(245,237,216,0.4)',fontSize:'0.78rem',cursor:'pointer',fontFamily:'Georgia, serif',lineHeight:1.3}}>
              {c.title}
            </button>
          ))}
          {courses.length===0 && <p style={{fontSize:'0.75rem',color:'rgba(245,237,216,0.25)',fontStyle:'italic',padding:'0.5rem'}}>Sin cursos matriculados</p>}
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,overflowY:'auto',padding:'2rem 2.5rem'}}>
        {!selectedCourse ? (
          <div style={{textAlign:'center',padding:'4rem'}}>
            <p style={{color:'rgba(245,237,216,0.3)',fontStyle:'italic'}}>Selecciona un curso</p>
            <Link href="/cursos" style={{display:'inline-block',marginTop:'1rem',padding:'0.65rem 1.5rem',background:G.gold,color:G.ink,borderRadius:'5px',textDecoration:'none',fontSize:'0.78rem',letterSpacing:'0.2em',fontWeight:'bold',fontFamily:'Georgia, serif'}}>VER CURSOS →</Link>
          </div>
        ) : tab==='notas' ? (
          <div style={{maxWidth:'750px'}}>
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'2rem'}}>
              <div>
                <h1 style={{fontSize:'1.4rem',letterSpacing:'0.2em',color:G.gold,marginBottom:'0.25rem'}}>MIS NOTAS</h1>
                <p style={{color:'rgba(245,237,216,0.4)',fontStyle:'italic',fontSize:'0.85rem'}}>{courses.find(c=>c.id===selectedCourse)?.title}</p>
              </div>
              {weightedAvg!==null && (
                <div style={{textAlign:'center',padding:'1rem 1.5rem',border:`1px solid ${scoreColor(weightedAvg)}30`,borderRadius:'10px',background:`${scoreColor(weightedAvg)}06`}}>
                  <div style={{fontSize:'2.2rem',fontWeight:'bold',color:scoreColor(weightedAvg),lineHeight:1}}>{weightedAvg}</div>
                  <div style={{fontSize:'0.62rem',letterSpacing:'0.18em',color:scoreColor(weightedAvg),marginTop:'0.2rem'}}>{scoreLabel(weightedAvg)}</div>
                  <div style={{fontSize:'0.6rem',color:'rgba(245,237,216,0.3)',marginTop:'0.1rem'}}>PROMEDIO PONDERADO</div>
                </div>
              )}
            </div>

            {/* Weights warning */}
            {totalWeight>0 && totalWeight!==100 && (
              <div style={{padding:'0.6rem 1rem',background:'rgba(196,122,58,0.08)',border:'1px solid rgba(196,122,58,0.2)',borderRadius:'6px',marginBottom:'1rem',fontSize:'0.78rem',color:G.orange}}>
                ⚠ Los pesos suman {totalWeight}% (debería ser 100%)
              </div>
            )}

            {courseAssignments.length===0 ? (
              <div style={{textAlign:'center',padding:'3rem',border:'1px dashed rgba(201,168,76,0.12)',borderRadius:'8px'}}>
                <p style={{color:'rgba(245,237,216,0.3)',fontStyle:'italic'}}>Aún no hay evaluaciones en este curso</p>
              </div>
            ) : (
              <div style={{border:'1px solid rgba(201,168,76,0.12)',borderRadius:'8px',overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 80px 80px',gap:'0.5rem',padding:'0.65rem 1.2rem',background:'rgba(201,168,76,0.04)',borderBottom:'1px solid rgba(201,168,76,0.08)',fontSize:'0.6rem',letterSpacing:'0.22em',color:'rgba(201,168,76,0.55)'}}>
                  <span>EVALUACIÓN</span><span>TIPO</span><span style={{textAlign:'center'}}>PESO</span><span style={{textAlign:'center'}}>NOTA</span>
                </div>
                {courseAssignments.map((a,i)=>{
                  const g=myGrades.find(g=>g.assignmentId===a.id)
                  return (
                    <div key={a.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 80px 80px',gap:'0.5rem',padding:'1rem 1.2rem',alignItems:'center',borderBottom:i<courseAssignments.length-1?'1px solid rgba(255,255,255,0.04)':'none',background:i%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                      <div>
                        <div style={{fontSize:'0.88rem',color:G.parchment}}>{a.title}</div>
                        {a.description && <div style={{fontSize:'0.72rem',color:'rgba(245,237,216,0.4)',marginTop:'0.15rem',lineHeight:1.4}}>{a.description.substring(0,80)}{a.description.length>80?'...':''}</div>}
                        {a.dueDate && <div style={{fontSize:'0.68rem',color:new Date(a.dueDate)<new Date()?G.red:'rgba(245,237,216,0.3)',marginTop:'0.1rem'}}>📅 {new Date(a.dueDate).toLocaleDateString('es')}</div>}
                      </div>
                      <div style={{fontSize:'0.75rem',color:'rgba(245,237,216,0.5)'}}>{TYPE_ICON[a.type]} {TYPE_LABEL[a.type]}</div>
                      <div style={{textAlign:'center',fontSize:'0.88rem',color:'rgba(245,237,216,0.5)'}}>{a.weight}%</div>
                      <div style={{textAlign:'center'}}>
                        {g ? (
                          <div>
                            <div style={{fontSize:'1.4rem',fontWeight:'bold',color:scoreColor(g.score),lineHeight:1}}>{g.score}</div>
                            {g.comment && <div style={{fontSize:'0.65rem',color:'rgba(245,237,216,0.35)',marginTop:'0.1rem',fontStyle:'italic'}}>{g.comment}</div>}
                          </div>
                        ) : <span style={{fontSize:'0.72rem',color:'rgba(245,237,216,0.25)',fontStyle:'italic'}}>—</span>}
                      </div>
                    </div>
                  )
                })}
                {weightedAvg!==null && (
                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 80px 80px',gap:'0.5rem',padding:'0.85rem 1.2rem',background:'rgba(201,168,76,0.06)',borderTop:'1px solid rgba(201,168,76,0.15)'}}>
                    <div style={{fontSize:'0.75rem',letterSpacing:'0.15em',color:G.gold,gridColumn:'1/4'}}>PROMEDIO PONDERADO</div>
                    <div style={{textAlign:'center',fontSize:'1.4rem',fontWeight:'bold',color:scoreColor(weightedAvg)}}>{weightedAvg}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TAREAS TAB */
          <div style={{maxWidth:'700px'}}>
            <h1 style={{fontSize:'1.4rem',letterSpacing:'0.2em',color:G.gold,marginBottom:'0.25rem'}}>MIS TAREAS</h1>
            <p style={{color:'rgba(245,237,216,0.4)',fontStyle:'italic',fontSize:'0.85rem',marginBottom:'2rem'}}>{courses.find(c=>c.id===selectedCourse)?.title}</p>
            {courseAssignments.length===0 ? (
              <div style={{textAlign:'center',padding:'3rem',border:'1px dashed rgba(201,168,76,0.12)',borderRadius:'8px'}}>
                <p style={{color:'rgba(245,237,216,0.3)',fontStyle:'italic'}}>No hay tareas asignadas aún</p>
              </div>
            ) : courseAssignments.map(a=>{
              const mySub=submissions.find(s=>s.assignmentId===a.id)
              const myGrade=myGrades.find(g=>g.assignmentId===a.id)
              return (
                <div key={a.id} style={{marginBottom:'1rem',border:'1px solid rgba(201,168,76,0.12)',borderRadius:'8px',overflow:'hidden'}}>
                  <div style={{padding:'1rem 1.2rem',borderBottom:mySub?'1px solid rgba(201,168,76,0.08)':'none',display:'flex',alignItems:'flex-start',gap:'1rem'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.3rem'}}>
                        <span>{TYPE_ICON[a.type]}</span>
                        <span style={{fontSize:'0.92rem',color:G.parchment}}>{a.title}</span>
                        <span style={{fontSize:'0.62rem',letterSpacing:'0.1em',padding:'0.1rem 0.5rem',borderRadius:'20px',border:'1px solid rgba(201,168,76,0.2)',color:G.goldDim}}>{a.weight}%</span>
                        {myGrade && <span style={{fontSize:'0.78rem',fontWeight:'bold',color:scoreColor(myGrade.score),marginLeft:'auto'}}>{myGrade.score} pts</span>}
                      </div>
                      {a.description && <p style={{fontSize:'0.82rem',color:'rgba(245,237,216,0.5)',lineHeight:1.6}}>{a.description}</p>}
                      {a.dueDate && <p style={{fontSize:'0.7rem',color:new Date(a.dueDate)<new Date()?G.red:'rgba(245,237,216,0.35)',marginTop:'0.3rem'}}>📅 Entrega: {new Date(a.dueDate).toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'})}</p>}
                    </div>
                    {!mySub && (
                      <button onClick={()=>setSubmitForm({assignmentId:a.id,fileUrl:'',content:''})}
                        style={{padding:'0.4rem 1rem',background:G.gold,color:G.ink,border:'none',borderRadius:'5px',fontSize:'0.7rem',letterSpacing:'0.12em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:'bold',flexShrink:0}}>
                        ENTREGAR
                      </button>
                    )}
                    {mySub && <span style={{fontSize:'0.65rem',letterSpacing:'0.1em',padding:'0.2rem 0.6rem',borderRadius:'20px',background:'rgba(74,155,127,0.15)',border:'1px solid rgba(74,155,127,0.3)',color:G.green,flexShrink:0}}>✓ ENTREGADO</span>}
                  </div>
                  {submitForm?.assignmentId===a.id && !mySub && (
                    <div style={{padding:'1rem 1.2rem',background:'rgba(255,255,255,0.02)'}}>
                      <div style={{fontSize:'0.65rem',letterSpacing:'0.2em',color:G.goldDim,marginBottom:'0.75rem'}}>ENTREGA DE TRABAJO</div>
                      {/* File upload */}
                      {!submitForm.fileUrl ? (
                        <div style={{marginBottom:'1rem'}}>
                          <div style={{fontSize:'0.75rem',color:'rgba(245,237,216,0.5)',marginBottom:'0.5rem'}}>Subir archivo (Word, PDF, TXT)</div>
                          <FileUploader
                            onUpload={(result)=>setSubmitForm(p=>p?{...p,fileUrl:result.url,content:`Archivo: ${result.fileName} (${(result.fileSize/1024).toFixed(0)}KB)`}:p)}
                            onCancel={()=>setSubmitForm(null)}
                          />
                        </div>
                      ) : (
                        <div style={{padding:'0.75rem',border:'1px solid rgba(74,155,127,0.25)',borderRadius:'6px',background:'rgba(74,155,127,0.05)',marginBottom:'0.75rem',display:'flex',alignItems:'center',gap:'0.75rem'}}>
                          <span style={{fontSize:'1.2rem'}}>📘</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.82rem',color:G.green}}>✓ Archivo listo para entregar</div>
                            <div style={{fontSize:'0.7rem',color:'rgba(245,237,216,0.4)',marginTop:'0.1rem'}}>{submitForm.content}</div>
                          </div>
                          <button onClick={()=>setSubmitForm(p=>p?{...p,fileUrl:'',content:''}:p)} style={{background:'transparent',border:'none',color:'rgba(245,237,216,0.3)',cursor:'pointer',fontSize:'0.75rem'}}>Cambiar</button>
                        </div>
                      )}
                      {/* Optional text */}
                      <textarea value={submitForm.fileUrl?'':submitForm.content} onChange={e=>setSubmitForm(p=>p?{...p,content:e.target.value}:p)} placeholder="O escribe tu trabajo directamente aquí (sin subir archivo)..." rows={4}
                        disabled={!!submitForm.fileUrl}
                        style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'5px',padding:'0.6rem 0.8rem',color:G.parchment,fontSize:'0.82rem',resize:'vertical',outline:'none',fontFamily:'Georgia, serif',marginBottom:'0.6rem',boxSizing:'border-box',opacity:submitForm.fileUrl?0.3:1}} />
                      {submitForm.fileUrl && (
                        <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
                          <button onClick={async()=>{
                            const r=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assignmentId:a.id,fileUrl:submitForm.fileUrl||null,content:submitForm.content||null})})
                            if(r.ok){const s=await r.json();setSubmissions(p=>[...p,s]);setSubmitForm(null);showToast('Trabajo entregado ✓')}
                          }} style={{padding:'0.55rem 1.2rem',background:G.gold,color:G.ink,border:'none',borderRadius:'5px',fontSize:'0.72rem',letterSpacing:'0.12em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:'bold'}}>✓ CONFIRMAR ENTREGA</button>
                          <button onClick={()=>setSubmitForm(null)} style={{padding:'0.55rem 0.8rem',background:'transparent',border:'1px solid rgba(245,237,216,0.12)',borderRadius:'5px',color:'rgba(245,237,216,0.4)',fontSize:'0.72rem',cursor:'pointer'}}>CANCELAR</button>
                        </div>
                      )}
                    </div>
                  )}
                  {mySub && (
                    <div style={{padding:'1rem 1.2rem',background:'rgba(74,155,127,0.02)'}}>
                      {mySub.fileUrl && <a href={mySub.fileUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',fontSize:'0.8rem',color:G.gold,textDecoration:'none',marginBottom:'0.5rem'}}>🔗 Ver archivo entregado →</a>}
                      {mySub.content && <p style={{fontSize:'0.82rem',color:'rgba(245,237,216,0.5)',lineHeight:1.6,marginBottom:'0.5rem',fontStyle:'italic'}}>{mySub.content.substring(0,200)}{mySub.content.length>200?'...':''}</p>}
                      <p style={{fontSize:'0.68rem',color:'rgba(245,237,216,0.3)'}}>Entregado: {new Date(mySub.submittedAt).toLocaleDateString('es',{day:'numeric',month:'long'})}</p>
                      {mySub.feedback && (
                        <div style={{marginTop:'0.75rem',padding:'0.85rem',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'6px',background:'rgba(201,168,76,0.04)'}}>
                          <div style={{fontSize:'0.6rem',letterSpacing:'0.2em',color:G.goldDim,marginBottom:'0.35rem'}}>FEEDBACK DEL RECTOR</div>
                          <p style={{fontSize:'0.85rem',color:'rgba(245,237,216,0.7)',lineHeight:1.7}}>{mySub.feedback}</p>
                          {mySub.feedbackAt && <p style={{fontSize:'0.65rem',color:'rgba(245,237,216,0.25)',marginTop:'0.3rem'}}>{new Date(mySub.feedbackAt).toLocaleDateString('es')}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── RECTOR VIEW ────────────────────────────────────────────────
function RectorView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string|null>(null)
  const [tab, setTab] = useState<'evaluaciones'|'notas'|'entregas'>('evaluaciones')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allGrades, setAllGrades] = useState<Grade[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<string|null>(null)
  const [assignForm, setAssignForm] = useState<typeof EMPTY_ASSIGN|null>(null)
  const [feedbackForm, setFeedbackForm] = useState<{subId:string;text:string}|null>(null)
  const [toast, setToast] = useState('')
  const showToast = (m:string)=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  const course = courses.find(c=>c.id===selectedCourse)
  const students = course?.enrollments?.map(e=>e.user) ?? []
  const courseAssignments = assignments.filter(a=>a.courseId===selectedCourse)
  const totalWeight = courseAssignments.reduce((s,a)=>s+a.weight,0)

  useEffect(()=>{
    fetch('/api/admin/courses-all').then(r=>r.json()).then(cs=>{
      setCourses(Array.isArray(cs)?cs:[])
      if(cs.length>0) setSelectedCourse(cs[0].id)
    })
  },[])

  useEffect(()=>{
    if(!selectedCourse) return
    Promise.all([
      fetch(`/api/assignments?courseId=${selectedCourse}`).then(r=>r.json()),
    ]).then(([a])=>{
      const assigns = Array.isArray(a)?a:[]
      setAssignments(assigns)
      setSelectedAssignment(assigns[0]?.id??null)
      // Fetch all grades for all students in this course
      const studentIds = (courses.find(c=>c.id===selectedCourse)?.enrollments??[]).map(e=>e.user.id)
      if(studentIds.length>0) {
        Promise.all(studentIds.map(uid=>fetch(`/api/grades?courseId=${selectedCourse}&userId=${uid}`).then(r=>r.json())))
          .then(results=>setAllGrades(results.flat()))
      } else { setAllGrades([]) }
    })
  },[selectedCourse, courses])

  useEffect(()=>{
    if(!selectedAssignment) return
    fetch(`/api/submissions?assignmentId=${selectedAssignment}`).then(r=>r.json()).then(s=>setSubmissions(Array.isArray(s)?s:[]))
  },[selectedAssignment])

  const getGrade = (assignmentId:string, userId:string) => allGrades.find(g=>g.assignmentId===assignmentId && g.userId===userId)

  const studentAvg = (studentId:string) => {
    let ws=0,tw=0
    courseAssignments.forEach(a=>{
      const g=getGrade(a.id,studentId)
      if(g){ws+=g.score*(a.weight/100);tw+=a.weight/100}
    })
    return tw>0?Math.round((ws/tw)*10)/10:null
  }

  return (
    <div style={{display:'flex',height:'calc(100vh - 53px)'}}>
      {toast && <div style={{position:'fixed',top:'1.5rem',right:'1.5rem',zIndex:100,background:'#1a1608',border:'1px solid rgba(201,168,76,0.5)',color:G.gold,padding:'0.75rem 1.5rem',borderRadius:'8px',fontSize:'0.85rem'}}>{toast}</div>}

      {/* Sidebar: course list */}
      <aside style={{width:'220px',borderRight:'1px solid rgba(201,168,76,0.08)',flexShrink:0,overflowY:'auto'}}>
        <div style={{padding:'0.75rem',borderBottom:'1px solid rgba(201,168,76,0.08)'}}>
          <div style={{fontSize:'0.6rem',letterSpacing:'0.3em',color:G.goldDim,marginBottom:'0.75rem',paddingLeft:'0.5rem'}}>CURSOS</div>
          {courses.map(c=>(
            <button key={c.id} onClick={()=>setSelectedCourse(c.id)}
              style={{width:'100%',textAlign:'left',padding:'0.65rem 0.75rem',marginBottom:'0.25rem',background:selectedCourse===c.id?'rgba(201,168,76,0.1)':'transparent',border:'none',borderRadius:'6px',borderLeft:`2px solid ${selectedCourse===c.id?G.gold:'transparent'}`,color:selectedCourse===c.id?G.parchment:'rgba(245,237,216,0.45)',fontSize:'0.78rem',cursor:'pointer',fontFamily:'Georgia, serif',lineHeight:1.3}}>
              <div>{c.title}</div>
              <div style={{fontSize:'0.65rem',color:'rgba(245,237,216,0.3)',marginTop:'0.15rem'}}>{c._count.enrollments} alumnos · {c._count.lessons} lecciones</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Course header + tabs */}
        {course && (
          <div style={{padding:'1rem 2rem',borderBottom:'1px solid rgba(201,168,76,0.08)',background:'rgba(0,0,0,0.2)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div>
              <div style={{fontSize:'1rem',color:G.goldLight,letterSpacing:'0.1em'}}>{course.title}</div>
              <div style={{fontSize:'0.7rem',color:'rgba(245,237,216,0.4)',marginTop:'0.15rem'}}>{course.category} · {students.length} alumnos matriculados</div>
            </div>
            <div style={{display:'flex',gap:'0.5rem'}}>
              {([['evaluaciones','⚙ Evaluaciones'],['notas','📊 Notas'],['entregas','📬 Entregas']] as [string,string][]).map(([id,label])=>(
                <button key={id} onClick={()=>setTab(id as any)}
                  style={{padding:'0.45rem 1rem',background:tab===id?G.gold:'transparent',color:tab===id?G.ink:'rgba(245,237,216,0.5)',border:`1px solid ${tab===id?G.gold:'rgba(201,168,76,0.2)'}`,borderRadius:'20px',fontSize:'0.72rem',letterSpacing:'0.1em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:tab===id?'bold':'normal'}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{flex:1,overflowY:'auto',padding:'1.5rem 2rem'}}>
          {!selectedCourse ? (
            <div style={{textAlign:'center',padding:'4rem',color:'rgba(245,237,216,0.3)',fontStyle:'italic'}}>Selecciona un curso</div>
          ) : tab==='evaluaciones' ? (

            /* ── EVALUACIONES TAB ── */
            <div style={{maxWidth:'700px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <div>
                  <h2 style={{fontSize:'1.1rem',letterSpacing:'0.2em',color:G.gold}}>EVALUACIONES DEL CURSO</h2>
                  <p style={{fontSize:'0.78rem',color:'rgba(245,237,216,0.4)',fontStyle:'italic',marginTop:'0.2rem'}}>Define las evaluaciones, su tipo, peso y fecha de entrega</p>
                </div>
                <button onClick={()=>setAssignForm({...EMPTY_ASSIGN})}
                  style={{padding:'0.5rem 1.1rem',background:G.gold,color:G.ink,border:'none',borderRadius:'5px',fontSize:'0.72rem',letterSpacing:'0.15em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:'bold'}}>
                  + NUEVA
                </button>
              </div>

              {totalWeight>0 && totalWeight!==100 && (
                <div style={{padding:'0.6rem 1rem',background:'rgba(196,122,58,0.08)',border:'1px solid rgba(196,122,58,0.2)',borderRadius:'6px',marginBottom:'1rem',fontSize:'0.78rem',color:G.orange}}>
                  ⚠ Los pesos actuales suman {totalWeight}% — deberían sumar 100%
                </div>
              )}

              {assignForm && (
                <div style={{padding:'1.2rem',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'8px',background:'rgba(201,168,76,0.03)',marginBottom:'1.5rem'}}>
                  <div style={{fontSize:'0.65rem',letterSpacing:'0.25em',color:G.gold,marginBottom:'0.75rem'}}>NUEVA EVALUACIÓN</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem',marginBottom:'0.6rem'}}>
                    <input value={assignForm.title} onChange={e=>setAssignForm(p=>p?{...p,title:e.target.value}:p)} placeholder="Nombre *"
                      style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'5px',padding:'0.6rem 0.8rem',color:G.parchment,fontSize:'0.82rem',outline:'none',fontFamily:'Georgia, serif'}} />
                    <select value={assignForm.type} onChange={e=>setAssignForm(p=>p?{...p,type:e.target.value}:p)}
                      style={{background:'#1a1608',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'5px',padding:'0.6rem 0.8rem',color:G.parchment,fontSize:'0.82rem',outline:'none',fontFamily:'Georgia, serif'}}>
                      {Object.entries(TYPE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                    <input value={assignForm.weight} onChange={e=>setAssignForm(p=>p?{...p,weight:e.target.value}:p)} placeholder="Peso % (ej: 30)" type="number" min="0" max="100"
                      style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'5px',padding:'0.6rem 0.8rem',color:G.parchment,fontSize:'0.82rem',outline:'none',fontFamily:'Georgia, serif'}} />
                    <input value={assignForm.dueDate} onChange={e=>setAssignForm(p=>p?{...p,dueDate:e.target.value}:p)} type="date"
                      style={{background:'#1a1608',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'5px',padding:'0.6rem 0.8rem',color:G.parchment,fontSize:'0.82rem',outline:'none',fontFamily:'Georgia, serif'}} />
                  </div>
                  <textarea value={assignForm.description} onChange={e=>setAssignForm(p=>p?{...p,description:e.target.value}:p)} placeholder="Instrucciones para el alumno..." rows={2}
                    style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'5px',padding:'0.6rem 0.8rem',color:G.parchment,fontSize:'0.82rem',resize:'none',outline:'none',fontFamily:'Georgia, serif',marginBottom:'0.6rem',boxSizing:'border-box'}} />
                  <div style={{display:'flex',gap:'0.5rem'}}>
                    <button onClick={async()=>{
                      if(!assignForm.title.trim()){showToast('Nombre requerido');return}
                      const r=await fetch('/api/assignments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...assignForm,courseId:selectedCourse})})
                      if(r.ok){const a=await r.json();setAssignments(p=>[...p,a]);setAssignForm(null);showToast('Evaluación creada ✓')}
                    }} style={{padding:'0.55rem 1.2rem',background:G.gold,color:G.ink,border:'none',borderRadius:'5px',fontSize:'0.72rem',letterSpacing:'0.12em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:'bold'}}>CREAR</button>
                    <button onClick={()=>setAssignForm(null)} style={{padding:'0.55rem 0.8rem',background:'transparent',border:'1px solid rgba(245,237,216,0.12)',borderRadius:'5px',color:'rgba(245,237,216,0.4)',fontSize:'0.72rem',cursor:'pointer'}}>CANCELAR</button>
                  </div>
                </div>
              )}

              {courseAssignments.length===0 ? (
                <div style={{textAlign:'center',padding:'3rem',border:'1px dashed rgba(201,168,76,0.12)',borderRadius:'8px'}}>
                  <p style={{color:'rgba(245,237,216,0.3)',fontStyle:'italic',marginBottom:'1rem'}}>No hay evaluaciones en este curso</p>
                  <button onClick={()=>setAssignForm({...EMPTY_ASSIGN})} style={{padding:'0.5rem 1.2rem',background:G.gold,color:G.ink,border:'none',borderRadius:'5px',fontSize:'0.72rem',letterSpacing:'0.15em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:'bold'}}>+ CREAR PRIMERA EVALUACIÓN</button>
                </div>
              ) : courseAssignments.map((a,i)=>(
                <div key={a.id} style={{marginBottom:'0.75rem',border:'1px solid rgba(201,168,76,0.12)',borderRadius:'8px',overflow:'hidden'}}>
                  <div style={{padding:'1rem 1.2rem',display:'flex',alignItems:'center',gap:'1rem'}}>
                    <span style={{fontSize:'1.3rem'}}>{TYPE_ICON[a.type]}</span>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.2rem'}}>
                        <span style={{fontSize:'0.92rem',color:G.parchment}}>{a.title}</span>
                        <span style={{fontSize:'0.62rem',letterSpacing:'0.12em',padding:'0.15rem 0.55rem',borderRadius:'20px',border:'1px solid rgba(201,168,76,0.25)',color:G.gold}}>{a.weight}%</span>
                        <span style={{fontSize:'0.62rem',color:'rgba(245,237,216,0.35)'}}>{TYPE_LABEL[a.type]}</span>
                      </div>
                      {a.description && <p style={{fontSize:'0.78rem',color:'rgba(245,237,216,0.45)',lineHeight:1.5}}>{a.description}</p>}
                      <div style={{display:'flex',gap:'1.5rem',marginTop:'0.25rem'}}>
                        {a.dueDate && <span style={{fontSize:'0.68rem',color:'rgba(245,237,216,0.35)'}}>📅 {new Date(a.dueDate).toLocaleDateString('es')}</span>}
                        <span style={{fontSize:'0.68rem',color:'rgba(245,237,216,0.35)'}}>📬 {a._count.submissions} entregas</span>
                      </div>
                    </div>
                    <button onClick={async()=>{if(!confirm('¿Eliminar?'))return;const r=await fetch(`/api/assignments/${a.id}`,{method:'DELETE'});if(r.ok){setAssignments(p=>p.filter(x=>x.id!==a.id));showToast('Eliminada')}}}
                      style={{padding:'0.25rem 0.6rem',background:'transparent',border:'1px solid rgba(220,60,60,0.25)',borderRadius:'4px',color:'rgba(220,60,60,0.5)',fontSize:'0.65rem',cursor:'pointer'}}>✕</button>
                  </div>
                </div>
              ))}

              {/* Weight summary */}
              {courseAssignments.length>0 && (
                <div style={{marginTop:'1.5rem',padding:'0.85rem 1.2rem',border:'1px solid rgba(201,168,76,0.15)',borderRadius:'8px',background:'rgba(201,168,76,0.03)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'0.75rem',color:'rgba(245,237,216,0.5)'}}>Total de pesos</span>
                  <span style={{fontSize:'1.1rem',fontWeight:'bold',color:totalWeight===100?G.green:G.orange}}>{totalWeight}%</span>
                </div>
              )}
            </div>

          ) : tab==='notas' ? (

            /* ── NOTAS TAB ── */
            <div>
              <div style={{marginBottom:'1.5rem'}}>
                <h2 style={{fontSize:'1.1rem',letterSpacing:'0.2em',color:G.gold}}>NOTAS POR ALUMNO</h2>
                <p style={{fontSize:'0.78rem',color:'rgba(245,237,216,0.4)',fontStyle:'italic',marginTop:'0.2rem'}}>Ingresa y edita las notas de cada evaluación</p>
              </div>

              {students.length===0 ? (
                <div style={{textAlign:'center',padding:'3rem',border:'1px dashed rgba(201,168,76,0.12)',borderRadius:'8px'}}>
                  <p style={{color:'rgba(245,237,216,0.3)',fontStyle:'italic'}}>Sin alumnos matriculados en este curso</p>
                </div>
              ) : courseAssignments.length===0 ? (
                <div style={{textAlign:'center',padding:'3rem',border:'1px dashed rgba(201,168,76,0.12)',borderRadius:'8px'}}>
                  <p style={{color:'rgba(245,237,216,0.3)',fontStyle:'italic',marginBottom:'0.75rem'}}>Primero crea las evaluaciones del curso</p>
                  <button onClick={()=>setTab('evaluaciones')} style={{padding:'0.45rem 1rem',background:G.gold,color:G.ink,border:'none',borderRadius:'5px',fontSize:'0.72rem',letterSpacing:'0.12em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:'bold'}}>IR A EVALUACIONES →</button>
                </div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:'600px'}}>
                    <thead>
                      <tr style={{background:'rgba(201,168,76,0.04)',borderBottom:'1px solid rgba(201,168,76,0.12)'}}>
                        <th style={{padding:'0.75rem 1rem',textAlign:'left',fontSize:'0.65rem',letterSpacing:'0.2em',color:'rgba(201,168,76,0.6)',fontWeight:'normal',minWidth:'160px'}}>ALUMNO</th>
                        {courseAssignments.map(a=>(
                          <th key={a.id} style={{padding:'0.75rem 0.5rem',textAlign:'center',fontSize:'0.65rem',letterSpacing:'0.1em',color:'rgba(201,168,76,0.6)',fontWeight:'normal',minWidth:'120px'}}>
                            <div>{a.title}</div>
                            <div style={{color:'rgba(245,237,216,0.3)',fontSize:'0.6rem',marginTop:'0.1rem'}}>{a.weight}%</div>
                          </th>
                        ))}
                        <th style={{padding:'0.75rem 0.5rem',textAlign:'center',fontSize:'0.65rem',letterSpacing:'0.1em',color:'rgba(201,168,76,0.6)',fontWeight:'normal',minWidth:'80px'}}>PROMEDIO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s,si)=>{
                        const avg=studentAvg(s.id)
                        return (
                          <tr key={s.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:si%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                            <td style={{padding:'0.75rem 1rem'}}>
                              <div style={{fontSize:'0.85rem',color:G.parchment}}>{s.name??'Sin nombre'}</div>
                              <div style={{fontSize:'0.68rem',color:'rgba(245,237,216,0.35)'}}>{s.email}</div>
                            </td>
                            {courseAssignments.map(a=>{
                              const g=getGrade(a.id,s.id)
                              return (
                                <td key={a.id} style={{padding:'0.5rem',textAlign:'center'}}>
                                  <div style={{display:'flex',gap:'0.3rem',alignItems:'center',justifyContent:'center'}}>
                                    <input type="number" min="0" max="100"
                                      defaultValue={g?.score??''}
                                      id={`g-${a.id}-${s.id}`}
                                      style={{width:'58px',background:'rgba(255,255,255,0.04)',border:`1px solid ${g?`${scoreColor(g.score)}40`:'rgba(201,168,76,0.15)'}`,borderRadius:'4px',padding:'0.3rem 0.4rem',color:g?scoreColor(g.score):G.parchment,fontSize:'0.85rem',outline:'none',textAlign:'center',fontFamily:'Georgia, serif'}} />
                                    <button onClick={async()=>{
                                      const el=document.getElementById(`g-${a.id}-${s.id}`) as HTMLInputElement
                                      const score=parseFloat(el.value)
                                      if(isNaN(score)||score<0||score>100){showToast('0-100 solamente');return}
                                      const r=await fetch('/api/grades',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assignmentId:a.id,userId:s.id,score})})
                                      if(r.ok){const ng=await r.json();setAllGrades(p=>[...p.filter(g=>!(g.assignmentId===a.id&&g.userId===s.id)),ng]);showToast(`${s.name}: ${score} ✓`)}
                                    }} style={{padding:'0.2rem 0.4rem',background:'rgba(74,155,127,0.15)',border:'1px solid rgba(74,155,127,0.25)',borderRadius:'3px',color:G.green,fontSize:'0.65rem',cursor:'pointer',fontFamily:'Georgia, serif'}}>✓</button>
                                  </div>
                                </td>
                              )
                            })}
                            <td style={{padding:'0.75rem 0.5rem',textAlign:'center'}}>
                              {avg!==null ? <div style={{fontSize:'1.1rem',fontWeight:'bold',color:scoreColor(avg)}}>{avg}</div> : <span style={{fontSize:'0.72rem',color:'rgba(245,237,216,0.25)'}}>—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          ) : (

            /* ── ENTREGAS TAB ── */
            <div>
              <div style={{marginBottom:'1.5rem'}}>
                <h2 style={{fontSize:'1.1rem',letterSpacing:'0.2em',color:G.gold}}>ENTREGAS DE TRABAJOS</h2>
                <p style={{fontSize:'0.78rem',color:'rgba(245,237,216,0.4)',fontStyle:'italic',marginTop:'0.2rem'}}>Revisa entregas y da feedback por evaluación</p>
              </div>

              {/* Assignment selector */}
              <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'1.5rem'}}>
                {courseAssignments.map(a=>(
                  <button key={a.id} onClick={()=>setSelectedAssignment(a.id)}
                    style={{padding:'0.4rem 0.9rem',background:selectedAssignment===a.id?G.gold:'transparent',color:selectedAssignment===a.id?G.ink:'rgba(245,237,216,0.5)',border:`1px solid ${selectedAssignment===a.id?G.gold:'rgba(201,168,76,0.2)'}`,borderRadius:'20px',fontSize:'0.72rem',letterSpacing:'0.1em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:selectedAssignment===a.id?'bold':'normal'}}>
                    {TYPE_ICON[a.type]} {a.title} <span style={{fontSize:'0.65rem',opacity:0.7}}>({a._count.submissions})</span>
                  </button>
                ))}
                {courseAssignments.length===0 && <p style={{color:'rgba(245,237,216,0.3)',fontStyle:'italic',fontSize:'0.85rem'}}>Sin evaluaciones — créalas primero en la pestaña ⚙ Evaluaciones</p>}
              </div>

              {submissions.length===0 && selectedAssignment ? (
                <div style={{textAlign:'center',padding:'3rem',border:'1px dashed rgba(201,168,76,0.12)',borderRadius:'8px'}}>
                  <p style={{color:'rgba(245,237,216,0.3)',fontStyle:'italic'}}>Sin entregas para esta evaluación</p>
                </div>
              ) : submissions.map(sub=>{
                const g=allGrades.find(g=>g.assignmentId===sub.assignmentId&&g.userId===sub.user?.id)
                return (
                  <div key={sub.id} style={{marginBottom:'1rem',border:'1px solid rgba(201,168,76,0.12)',borderRadius:'8px',overflow:'hidden'}}>
                    <div style={{padding:'1rem 1.2rem',background:'rgba(255,255,255,0.02)',borderBottom:'1px solid rgba(201,168,76,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                        <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',color:G.gold,flexShrink:0}}>{sub.user?.name?.[0]?.toUpperCase()??'?'}</div>
                        <div>
                          <div style={{fontSize:'0.88rem',color:G.parchment}}>{sub.user?.name??'Sin nombre'}</div>
                          <div style={{fontSize:'0.68rem',color:'rgba(245,237,216,0.35)'}}>{new Date(sub.submittedAt).toLocaleDateString('es',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                      </div>
                      {g && <div style={{textAlign:'center'}}>
                        <div style={{fontSize:'1.4rem',fontWeight:'bold',color:scoreColor(g.score),lineHeight:1}}>{g.score}</div>
                        <div style={{fontSize:'0.6rem',color:scoreColor(g.score)}}>{scoreLabel(g.score)}</div>
                      </div>}
                    </div>
                    <div style={{padding:'1rem 1.2rem'}}>
                      {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',fontSize:'0.8rem',color:G.gold,textDecoration:'none',marginBottom:'0.75rem',padding:'0.4rem 0.85rem',border:'1px solid rgba(201,168,76,0.25)',borderRadius:'5px',background:'rgba(201,168,76,0.05)'}}>🔗 Abrir trabajo entregado →</a>}
                      {sub.content && <p style={{fontSize:'0.85rem',color:'rgba(245,237,216,0.6)',lineHeight:1.7,marginBottom:'0.75rem',padding:'0.75rem',background:'rgba(255,255,255,0.02)',borderRadius:'5px',fontStyle:'italic',whiteSpace:'pre-wrap'}}>{sub.content}</p>}
                      {sub.feedback && (
                        <div style={{padding:'0.75rem',border:'1px solid rgba(201,168,76,0.15)',borderRadius:'6px',background:'rgba(201,168,76,0.03)',marginBottom:'0.75rem'}}>
                          <div style={{fontSize:'0.6rem',letterSpacing:'0.2em',color:G.goldDim,marginBottom:'0.3rem'}}>FEEDBACK ENVIADO</div>
                          <p style={{fontSize:'0.85rem',color:'rgba(245,237,216,0.65)',lineHeight:1.7}}>{sub.feedback}</p>
                        </div>
                      )}
                      {feedbackForm?.subId===sub.id ? (
                        <div>
                          <textarea value={feedbackForm.text} onChange={e=>setFeedbackForm(p=>p?{...p,text:e.target.value}:p)} placeholder="Escribe tu feedback..." rows={3}
                            style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:'5px',padding:'0.6rem 0.8rem',color:G.parchment,fontSize:'0.85rem',resize:'vertical',outline:'none',fontFamily:'Georgia, serif',marginBottom:'0.5rem',boxSizing:'border-box'}} />
                          <div style={{display:'flex',gap:'0.5rem'}}>
                            <button onClick={async()=>{
                              const r=await fetch(`/api/submissions/${sub.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({feedback:feedbackForm.text})})
                              if(r.ok){const updated=await r.json();setSubmissions(p=>p.map(s=>s.id===sub.id?updated:s));setFeedbackForm(null);showToast('Feedback enviado ✓')}
                            }} style={{padding:'0.5rem 1.1rem',background:G.gold,color:G.ink,border:'none',borderRadius:'5px',fontSize:'0.72rem',letterSpacing:'0.12em',cursor:'pointer',fontFamily:'Georgia, serif',fontWeight:'bold'}}>ENVIAR</button>
                            <button onClick={()=>setFeedbackForm(null)} style={{padding:'0.5rem 0.8rem',background:'transparent',border:'1px solid rgba(245,237,216,0.12)',borderRadius:'5px',color:'rgba(245,237,216,0.4)',fontSize:'0.72rem',cursor:'pointer'}}>CANCELAR</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={()=>setFeedbackForm({subId:sub.id,text:sub.feedback??''})}
                          style={{padding:'0.4rem 0.9rem',background:'transparent',border:`1px solid ${G.gold}40`,borderRadius:'5px',color:G.gold,fontSize:'0.72rem',letterSpacing:'0.12em',cursor:'pointer',fontFamily:'Georgia, serif'}}>
                          {sub.feedback?'✏ EDITAR FEEDBACK':'+ DAR FEEDBACK'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────
export default function AcademicoPage() {
  const { data: session, status } = useSession()
  const isRector = (session?.user as any)?.role === 'RECTOR'

  if (status === 'unauthenticated') return (
    <div style={{minHeight:'100vh',background:G.ink,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia, serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🎓</div>
        <p style={{color:'rgba(201,168,76,0.6)',letterSpacing:'0.2em',marginBottom:'1.5rem',fontSize:'0.85rem'}}>ACCESO RESTRINGIDO</p>
        <Link href="/auth/signin" style={{padding:'0.75rem 2rem',background:G.gold,color:G.ink,borderRadius:'5px',textDecoration:'none',fontSize:'0.8rem',letterSpacing:'0.2em',fontWeight:'bold'}}>INICIAR SESIÓN →</Link>
      </div>
    </div>
  )

  if (status === 'loading') return (
    <div style={{minHeight:'100vh',background:G.ink,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'rgba(201,168,76,0.4)',fontFamily:'Georgia, serif',fontStyle:'italic'}}>Cargando...</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:G.ink,color:G.parchment,fontFamily:'Georgia, serif'}}>
      <div style={{position:'fixed',inset:0,background:'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 60%)',pointerEvents:'none'}} />
      <header style={{borderBottom:'1px solid rgba(201,168,76,0.1)',padding:'0.85rem 2rem',display:'flex',alignItems:'center',gap:'1rem',background:'rgba(0,0,0,0.3)',position:'sticky',top:0,zIndex:10}}>
        <Link href="/" style={{fontSize:'0.7rem',letterSpacing:'0.2em',color:'rgba(245,237,216,0.3)',textDecoration:'none'}}>← INICIO</Link>
        <span style={{color:'rgba(201,168,76,0.3)'}}>·</span>
        <span style={{fontSize:'0.85rem',letterSpacing:'0.2em',color:G.gold}}>🎓 ACADÉMICO{isRector?' — PANEL RECTOR':''}</span>
      </header>
      <div style={{position:'relative',zIndex:1}}>
        {isRector ? <RectorView /> : <StudentView />}
      </div>
    </div>
  )
}
