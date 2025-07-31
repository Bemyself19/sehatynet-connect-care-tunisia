import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, PhoneOff, Mic, MicOff, VideoOff, AlertCircle, FilePlus, Notebook, ArrowLeft, Heart, User, Clock, MessageSquare, Activity, Settings, Users, Calendar, HeartPulse, Wind, Droplets } from 'lucide-react';
import api from '@/lib/api';
import { Appointment } from '@/types/appointment';
import { User as UserType } from '@/types/user';
import { PrescriptionModal } from '@/components/prescription/PrescriptionModal';
// Removed duplicate Dialog imports
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CreateMedicalRecordData } from '@/types/medicalRecord';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import VideoCallTroubleshooting from '@/components/VideoCallTroubleshooting';

// PeerJS dynamic import
let Peer: any = null;

const WS_URL = (() => {
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const host = window.location.hostname || 'localhost';
  const port = '5000';
  return `${protocol}${host}:${port}/ws`;
})();

const PEER_HOST = window.location.hostname || 'localhost';
const PEER_PORT = 9000;
const PEER_PATH = '/peerjs';
const PEER_SECURE = window.location.protocol === 'https:';
const PEER_API_KEY = 'sehatynet';
const PEER_DEBUG = 3;

// Fallback to public PeerJS server if local server fails
const USE_PUBLIC_PEER_SERVER = false; // Set to true if local PeerJS server is not running
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

const LiveConsultation: React.FC = () => {
  const { t } = useTranslation();
  const { appointmentId } = useParams<{ appointmentId: string }>();

  // Accordion state for doctor notes
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // State
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPeerId, setMyPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState('Initializing...');
  const [isMicMuted, setMicMuted] = useState(false);
  const [isCameraOff, setCameraOff] = useState(false);

  // Status translation helper
  const getTranslatedStatus = (statusKey: string) => {
    const statusMap: { [key: string]: string } = {
      'Initializing...': t('initializing'),
      'Camera and microphone ready': t('cameraAndMicrophoneReady'),
      'Media access denied': t('mediaAccessDenied'),
      'Waiting for other participant...': t('waitingForOtherParticipant'),
      'Connected': t('connected'),
      'Disconnected from server': t('disconnectedFromServer'),
      'Connection closed': t('connectionClosed')
    };
    return statusMap[statusKey] || statusKey;
  };
  const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [vitals, setVitals] = useState<any>(null);
  const [isVitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'notes' | 'records'>('notes');

  // Refs
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const isActiveTabRef = useRef<boolean>(true);

  // Retry media access function
  const retryMediaAccess = () => {
    setError(null);
    setStatus('Initializing...');
    // Force re-run of the PeerJS setup effect
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 100);
  };

  // Fetch appointment and user data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [appointmentData, currentUserData] = await Promise.all([
          api.getAppointmentById(appointmentId),
          api.getProfile()
        ]);
        setAppointment(appointmentData);
        setCurrentUser(currentUserData);
      } catch (err) {
        setError('Failed to load consultation data.');
      } finally {
        setIsLoading(false);
      }
    };
    if (appointmentId) fetchData();
  }, [appointmentId]);

  // Fetch patient notes and medical records when appointment is loaded
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!appointment || !currentUser || currentUser._id !== appointment.providerId._id) return;
      
      try {
        setNotesLoading(true);
        setRecordsLoading(true);
        setNotesError(null);
        setRecordsError(null);

        // Fetch only records from the current doctor (filtered by doctorId)
        const [notesData, recordsData] = await Promise.all([
          api.getDoctorNotes(appointment.patientId._id, currentUser._id),
          api.getDoctorOnlyMedicalRecords(appointment.patientId._id, currentUser._id)
        ]);

        setDoctorNotes(notesData);
        setMedicalRecords(recordsData);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setNotesError('Failed to load patient notes');
        setRecordsError('Failed to load medical records');
      } finally {
        setNotesLoading(false);
        setRecordsLoading(false);
      }
    };

    fetchPatientData();
  }, [appointment, currentUser]);

  // PeerJS/WebRTC setup
  useEffect(() => {
    if (!appointment || !currentUser) return;
    let localStream: MediaStream;
    let destroyed = false;
    let peerInstance: any;
    let ws: WebSocket | null = null;
    let callInstance: any = null;

    const setup = async () => {
      try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Media stream obtained:', localStream);
        console.log('Video tracks:', localStream.getVideoTracks().length);
        console.log('Audio tracks:', localStream.getAudioTracks().length);
        
        setMyStream(localStream);
        
        // Attach stream to video element
        if (myVideoRef.current) {
          console.log('Attaching stream to local video element');
          myVideoRef.current.srcObject = localStream;
          
          // Ensure video plays
          try {
            await myVideoRef.current.play();
            console.log('Local video is playing');
          } catch (playError) {
            console.log('Local video play error:', playError);
            // Try again after a short delay
            setTimeout(() => {
              if (myVideoRef.current) {
                myVideoRef.current.play().catch(e => console.log('Retry local video play error:', e));
              }
            }, 500);
          }
        } else {
          console.log('Local video ref is not available');
        }
        
        setStatus('Camera and microphone ready');
      } catch (err: any) {
        console.error('Media access error:', err);
        
        let errorMessage = 'Could not access camera or microphone. ';
        
        if (err.name === 'NotAllowedError') {
          errorMessage += 'Please allow camera and microphone permissions in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          errorMessage += 'No camera or microphone found. Please check your device connections.';
        } else if (err.name === 'NotReadableError') {
          errorMessage += 'Camera or microphone is already in use by another application.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage += 'Camera or microphone does not meet the required specifications.';
        } else if (location.protocol === 'http:' && location.hostname !== 'localhost') {
          errorMessage += 'Video calls require a secure connection (HTTPS). Please use HTTPS or localhost.';
        } else {
          errorMessage += 'Please check permissions and try again.';
        }
        
        setError(errorMessage);
        setStatus('Media access denied');
        
        // Try audio-only fallback
        try {
          console.log('Attempting audio-only fallback...');
          localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMyStream(localStream);
          setStatus('Audio-only mode (camera unavailable)');
          setError('Video unavailable. Connected in audio-only mode.');
        } catch (audioErr) {
          console.error('Audio-only fallback failed:', audioErr);
          return;
        }
      }
      // Dynamic import PeerJS
      if (!Peer) Peer = (await import('peerjs')).default;
      // Peer ID
      const peerId = `${appointmentId}_${currentUser._id}_${currentUser.role}`;
      setMyPeerId(peerId);
      // Create Peer
      const peerConfig = USE_PUBLIC_PEER_SERVER ? {
        config: { iceServers: ICE_SERVERS },
        debug: PEER_DEBUG
      } : {
        host: PEER_HOST,
        port: PEER_PORT,
        path: PEER_PATH,
        secure: PEER_SECURE,
        key: PEER_API_KEY,
        config: { iceServers: ICE_SERVERS },
        debug: PEER_DEBUG
      };
      
      peerInstance = new Peer(peerId, peerConfig);
      peerRef.current = peerInstance;
      
      // Handle peer connection events
      peerInstance.on('open', (id) => {
        console.log('PeerJS connected with ID:', id);
        setStatus('Waiting for other participant...');
      });
      
      peerInstance.on('error', (err) => {
        console.error('PeerJS error:', err);
        if (err.type === 'invalid-key') {
          setError('PeerJS server configuration error. Please check server setup.');
        } else if (err.type === 'server-error') {
          setError('Cannot connect to PeerJS server. Please check if the server is running.');
        } else {
          setError(`PeerJS error: ${err.type}`);
        }
      });
      
      peerInstance.on('disconnected', () => {
        console.log('PeerJS disconnected');
        setStatus('Disconnected from server');
      });
      
      peerInstance.on('close', () => {
        console.log('PeerJS connection closed');
        setStatus('Connection closed');
      });
      // WebSocket for signaling
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'JOIN_CONSULTATION', appointmentId, peerId }));
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'PEER_JOINED' && data.peerId !== peerId) {
          setRemotePeerId(data.peerId);
          if (currentUser.role === 'patient') {
            callInstance = peerInstance.call(data.peerId, localStream);
            callInstance.on('stream', (remoteStream: MediaStream) => {
              setRemoteStream(remoteStream);
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
              setStatus('Connected');
            });
          }
        }
      };
      // Handle incoming calls
      peerInstance.on('call', (call: any) => {
        call.answer(localStream);
        call.on('stream', (remoteStream: MediaStream) => {
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
          setStatus('Connected');
        });
      });
    };
    setup();
    return () => {
      destroyed = true;
      if (localStream) localStream.getTracks().forEach(track => track.stop());
      if (peerInstance && !peerInstance.destroyed) peerInstance.destroy();
      if (ws) ws.close();
    };
  }, [appointment, currentUser, appointmentId]);

  // Effect to handle local video stream
  useEffect(() => {
    if (myStream && myVideoRef.current) {
      console.log('Attaching local stream in useEffect');
      myVideoRef.current.srcObject = myStream;
      myVideoRef.current.muted = true; // Prevent echo
      myVideoRef.current.playsInline = true;
      myVideoRef.current.autoplay = true;
      
      // Force play
      myVideoRef.current.play().catch(error => {
        console.error('Error playing local video in useEffect:', error);
      });
    }
  }, [myStream]);

  // Effect to handle remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('Attaching remote stream in useEffect');
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.playsInline = true;
      remoteVideoRef.current.autoplay = true;
      
      // Force play
      remoteVideoRef.current.play().catch(error => {
        console.error('Error playing remote video in useEffect:', error);
      });
    }
  }, [remoteStream]);

  // UI event handlers
  const toggleMic = () => {
    if (myStream) {
      const audioTracks = myStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicMuted(!isMicMuted);
      console.log('Microphone toggled:', !isMicMuted ? 'muted' : 'unmuted');
    }
  };
  
  const toggleCamera = () => {
    if (myStream) {
      const videoTracks = myStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setCameraOff(!isCameraOff);
      console.log('Camera toggled:', !isCameraOff ? 'off' : 'on');
    }
  };
  const endCall = () => {
    if (myStream) myStream.getTracks().forEach(track => track.stop());
    if (remoteStream) remoteStream.getTracks().forEach(track => track.stop());
    if (peerRef.current && !peerRef.current.destroyed) peerRef.current.destroy();
    if (wsRef.current) wsRef.current.close();
    window.history.back();
  };
  // Notes and records
  const handleCreateNote = async () => {
      // Debug: fetch all medical records for the patient after saving
      try {
        const allRecords = await api.getPatientMedicalHistory(appointment.patientId._id);
        console.log('[DEBUG] All medical records for patient:', allRecords);
      } catch (err) {
        console.error('[DEBUG] Failed to fetch all medical records:', err);
      }
    if (!note.trim() || !appointment) return;
    setNoteLoading(true);
    try {
      const noteData: CreateMedicalRecordData = {
        patientId: appointment.patientId._id,
        appointmentId: appointment._id,
        type: 'consultation',
        title: t('doctorNote'),
        date: new Date().toISOString(),
        details: { note: note.trim(), privacy: 'doctor-only' },
        privacyLevel: 'doctor_only',
        isPrivate: true
      };
          const created = await api.createMedicalRecord(noteData);
          console.log('[DEBUG] Created note:', created);
      toast.success('Note saved successfully');
      setNote('');
      setNoteModalOpen(false);
      // Reload notes by refetching all patient data (notes and records)
      if (appointment && currentUser && currentUser._id === appointment.providerId._id) {
        setNotesLoading(true);
        setRecordsLoading(true);
        setNotesError(null);
        setRecordsError(null);
        try {
          const [notesData, recordsData] = await Promise.all([
            api.getDoctorNotes(appointment.patientId._id, currentUser._id),
            api.getDoctorOnlyMedicalRecords(appointment.patientId._id, currentUser._id)
          ]);
              console.log('[DEBUG] Notes after save:', notesData);
          setDoctorNotes(notesData);
          setMedicalRecords(recordsData);
        } catch (error) {
          setNotesError('Failed to load patient notes');
          setRecordsError('Failed to load medical records');
        } finally {
          setNotesLoading(false);
          setRecordsLoading(false);
        }
      }
    } catch (error: any) {
      let message = 'Failed to save note';
      if (error && error.message) message += `: ${error.message}`;
      toast.error(message);
    } finally {
      setNoteLoading(false);
    }
  };

  // UI rendering
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (error || !appointment || !currentUser) {
    // Show troubleshooting component for media access errors
    if (error && (error.includes('camera') || error.includes('microphone') || error.includes('media'))) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <VideoCallTroubleshooting 
            error={error} 
            onRetry={retryMediaAccess}
          />
        </div>
      );
    }
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Unable to load consultation.'}</div>;
  }

  const isPatient = currentUser._id === appointment.patientId._id;
  const patientName = `${appointment.patientId.firstName} ${appointment.patientId.lastName}`;
  const doctorName = `Dr. ${appointment.providerId.firstName} ${appointment.providerId.lastName}`;
  const localVideoTitle = isPatient ? patientName : doctorName;
  const remoteVideoTitle = isPatient ? doctorName : patientName;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>{t('back')}</span>
              </Button>
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <Heart className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    SehatyNet+
                  </span>
                  <div className="text-xs text-gray-500 -mt-1">Telehealth Platform</div>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600">{t('appointmentId')}: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{appointmentId}</span></span>
              </div>
              <Button variant="destructive" onClick={endCall} className="bg-red-600 hover:bg-red-700">
                <PhoneOff className="h-4 w-4 mr-2" /> {t('endCall')}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Local Video */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>You ({localVideoTitle})</span>
                    {isMicMuted && <Badge variant="outline" className="text-xs">Muted</Badge>}
                    {isCameraOff && <Badge variant="outline" className="text-xs">Camera Off</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
                    {myStream ? (
                      <video 
                        playsInline 
                        muted 
                        ref={myVideoRef} 
                        autoPlay 
                        controls={false} 
                        className="w-full h-full object-cover"
                        style={{ display: 'block' }}
                        onLoadedMetadata={() => console.log('Local video metadata loaded')}
                        onCanPlay={() => console.log('Local video can play')}
                        onPlaying={() => console.log('Local video is playing')}
                        onError={(e) => console.error('Local video error:', e)}
                      />
                    ) : (
                      <div className="text-center text-white">
                        <VideoOff className="h-16 w-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm opacity-75">{t('cameraNotAvailable')}</p>
                      </div>
                    )}
                    {isCameraOff && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <VideoOff className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Remote Video */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>{remoteVideoTitle}</span>
                    {status === 'Connected' && <Badge className="bg-green-100 text-green-800 text-xs">{t('live')}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
                    {remoteStream ? (
                      <video 
                        playsInline 
                        ref={remoteVideoRef} 
                        autoPlay 
                        controls={false} 
                        className="w-full h-full object-cover"
                        style={{ display: 'block' }}
                        onLoadedMetadata={() => console.log('Remote video metadata loaded')}
                        onCanPlay={() => console.log('Remote video can play')}
                        onPlaying={() => console.log('Remote video is playing')}
                        onError={(e) => console.error('Remote video error:', e)}
                      />
                    ) : (
                      <div className="text-center text-white">
                        <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm opacity-75">{t('waitingForConnection')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Call Controls */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex justify-center space-x-4">
                  <Button variant={isMicMuted ? 'destructive' : 'outline'} size="lg" onClick={toggleMic} className="w-16 h-16 rounded-full">
                    {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  <Button variant="destructive" size="lg" onClick={endCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700">
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                  <Button variant={isCameraOff ? 'destructive' : 'outline'} size="lg" onClick={toggleCamera} className="w-16 h-16 rounded-full">
                    {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                  </Button>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    {t('appointmentId')}: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{appointmentId}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Appointment Info */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>{t('appointmentInfo')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {isPatient ? appointment.providerId.firstName?.charAt(0) : appointment.patientId.firstName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {isPatient ? doctorName : patientName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {isPatient ? t('healthcareProvider') : t('patient')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {new Date(appointment.scheduledDate).toLocaleDateString('fr-TN')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {appointment.appointmentType || 'Consultation'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Doctor Actions (only for providers) */}
              {!isPatient && (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-purple-600" />
                      <span>{t('actions')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" onClick={() => setPrescriptionModalOpen(true)}>
                      <FilePlus className="h-4 w-4 mr-2" /> {t('createPrescription')}
                    </Button>
                    <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={() => setNoteModalOpen(true)}>
                      <Notebook className="h-4 w-4 mr-2" /> {t('addNote')}
                    </Button>
                    <Button className="w-full justify-start bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700" onClick={() => setVitalsModalOpen(true)}>
                      <HeartPulse className="h-4 w-4 mr-2" /> {t('viewLiveVitals')}
                    </Button>
                  </CardContent>
                </Card>
              )}
              {/* Connection Status */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span>{t('connection')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('status')}</span>
                      <Badge className={status === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {getTranslatedStatus(status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('audio')}</span>
                      <Badge variant={isMicMuted ? 'destructive' : 'default'}>
                        {isMicMuted ? t('muted') : t('active')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t('video')}</span>
                      <Badge variant={isCameraOff ? 'destructive' : 'default'}>
                        {isCameraOff ? t('off') : t('active')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        {/* Patient Information Section (for providers) */}
        {currentUser && appointment && currentUser._id === appointment.providerId._id && (
          <Card className="mt-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <span>{t('patientInformation')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-xs mb-4">
                <Select value={activeSection} onValueChange={(val) => setActiveSection(val as 'notes' | 'records')}>
                  <SelectTrigger>
                    <SelectValue>
                      {activeSection === 'notes' ? t('doctorNotesTab', 'Doctor Notes') : t('medicalRecordsTab', 'Medical Records')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notes">
                      <span className="flex items-center gap-2"><Notebook className="h-4 w-4" />{t('doctorNotesTab', 'Doctor Notes')}</span>
                    </SelectItem>
                    <SelectItem value="records">
                      <span className="flex items-center gap-2"><Activity className="h-4 w-4" />{t('medicalRecordsTab', 'Medical Records')}</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {activeSection === 'notes' ? (
                <div className="bg-white/90 rounded-lg shadow p-6 min-h-[180px]">
                  {notesLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-600">{t('loadingNotes')}</p>
                    </div>
                  ) : notesError ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-red-600">{notesError}</p>
                    </div>
                  ) : doctorNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Notebook className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">{t('noNotesFound')}</p>
                      <p className="text-gray-400 text-sm mt-2">{t('addNotePrompt')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {doctorNotes.map(note => (
                        <div key={note._id} className="py-2">
                          <div
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-2 py-2"
                            onClick={() => setExpandedNoteId(expandedNoteId === note._id ? null : note._id)}
                          >
                            <div>
                              <span className="font-medium">{new Date(note.date).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                              <span className="ml-2 text-gray-600">{note.providerId?.firstName} {note.providerId?.lastName}</span>
                            </div>
                            <span className="text-blue-600 text-sm">{expandedNoteId === note._id ? t('hide') : t('show')}</span>
                          </div>
                          {expandedNoteId === note._id && (
                            <div className="mt-2 bg-gray-50 rounded p-3 text-sm">
                              <div><span className="font-semibold">{t('note')}:</span> {note.details?.note || ''}</div>
                              {/* Add more fields if needed */}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                recordsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loadingMedicalRecords')}</p>
                  </div>
                ) : recordsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">{recordsError}</p>
                  </div>
                ) : medicalRecords.filter(record => record.type !== 'doctor_note').length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{t('noMedicalRecordsFound')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('date')}</TableHead>
                          <TableHead>{t('provider')}</TableHead>
                          <TableHead>{t('actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medicalRecords.filter(record => record.type !== 'doctor_note').map(record => (
                          <TableRow key={record._id}>
                            <TableCell>{new Date(record.date).toLocaleDateString('fr-TN')}</TableCell>
                            <TableCell>{record.providerId?.firstName} {record.providerId?.lastName}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => { setSelectedRecord(record); setRecordModalOpen(true); }}>
                                {t('viewDetails')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        )}
      </main>
      {/* Modals */}
      <PrescriptionModal
        open={isPrescriptionModalOpen}
        onClose={() => setPrescriptionModalOpen(false)}
        appointmentId={appointment._id}
        patientId={appointment.patientId._id}
        patientName={`${appointment.patientId.firstName} ${appointment.patientId.lastName}`}
        onPrescriptionCreated={() => setPrescriptionModalOpen(false)}
      />
      <Dialog open={isNoteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Notebook className="h-5 w-5 text-blue-600" />
              <span>{t('addDoctorNote')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('addPrivateNoteDescription')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t('enterPrivateNotePlaceholder')}
            rows={6}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreateNote} disabled={noteLoading || !note.trim()} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {noteLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('saving')}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Notebook className="h-4 w-4" />
                  <span>{t('saveNote')}</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isRecordModalOpen} onOpenChange={setRecordModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('medicalRecordDetails', 'Medical Record Details')}</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              <div>
                <span className="font-semibold">{t('date')}:</span> {new Date(selectedRecord.date).toLocaleDateString('fr-TN')}
              </div>
              <div>
                <span className="font-semibold">{t('provider')}:</span> {selectedRecord.providerId?.firstName} {selectedRecord.providerId?.lastName}
              </div>
              <div>
                <span className="font-semibold">{t('type')}:</span> {selectedRecord.type}
              </div>
              {/* Prescription details rendering */}
              {selectedRecord.type === 'prescription' && selectedRecord.details ? (
                <div className="space-y-2">
                  {Object.entries(selectedRecord.details).map(([key, value]) => {
                    const labelMap: Record<string, string> = {
                      medication: t('medication', 'Médicament'),
                      medicationName: t('medication', 'Médicament'),
                      dosage: t('dosage', 'Posologie'),
                      instructions: t('instructions', 'Instructions'),
                      frequency: t('frequency', 'Fréquence'),
                      duration: t('duration', 'Durée'),
                      note: t('note', 'Notes'),
                      prescriptionId: t('prescriptionId', 'ID de prescription'),
                      medications: t('medications', 'Médicaments'),
                      labTests: t('labTests', 'Analyses de laboratoire'),
                      radiologyExams: t('radiologyExams', "Examens d'imagerie"),
                    };
                    // Render arrays as tables for user-friendly view
                    if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
                      return (
                        <div key={key}>
                          <span className="font-semibold">{labelMap[key] || t(key)}:</span>
                          <table className="min-w-full border mt-2 mb-2 text-sm">
                            <thead>
                              <tr>
                                {Object.keys(value[0]).map((col) => (
                                  <th key={col} className="border px-2 py-1 font-semibold">{t(col)}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {value.map((item, idx) => (
                                <tr key={idx}>
                                  {Object.values(item).map((cell, cidx) => (
                                    <td key={cidx} className="border px-2 py-1">{String(cell)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    // Render objects as key-value pairs
                    if (typeof value === 'object' && value !== null) {
                      return (
                        <div key={key}>
                          <span className="font-semibold">{labelMap[key] || t(key)}:</span>
                          <div className="ml-2">
                            {Object.entries(value).map(([subKey, subValue]) => (
                              <div key={subKey}><span className="font-medium">{t(subKey)}:</span> {String(subValue)}</div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    // Render primitives
                    return (
                      <div key={key}>
                        <span className="font-semibold">{labelMap[key] || t(key)}:</span> {String(value)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <span className="font-semibold">{t('details')}:</span> {selectedRecord.details?.note || selectedRecord.details?.description || ''}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordModalOpen(false)}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isVitalsModalOpen} onOpenChange={setVitalsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <HeartPulse className="h-5 w-5 text-red-600" />
              <span>{t('liveVitalSigns')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('liveVitalSignsDescription')}
            </DialogDescription>
          </DialogHeader>
          {vitals ? (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col items-center">
                <HeartPulse className="h-8 w-8 text-red-500 mb-1" />
                <span className="font-bold text-lg">{vitals.heartRate ?? '--'}</span>
                <span className="text-xs text-gray-500">{t('heartRateBpm')}</span>
              </div>
              <div className="flex flex-col items-center">
                <Wind className="h-8 w-8 text-blue-500 mb-1" />
                <span className="font-bold text-lg">{vitals.respiration ?? '--'}</span>
                <span className="text-xs text-gray-500">{t('respirationRpm')}</span>
              </div>
              <div className="flex flex-col items-center">
                <Activity className="h-8 w-8 text-orange-500 mb-1" />
                <span className="font-bold text-lg">{vitals.temperature ?? '--'}</span>
                <span className="text-xs text-gray-500">{t('temperatureC')}</span>
              </div>
              <div className="flex flex-col items-center">
                <Droplets className="h-8 w-8 text-indigo-500 mb-1" />
                <span className="font-bold text-lg">{vitals.oxygenSaturation ?? '--'}</span>
                <span className="text-xs text-gray-500">{t('oxygenSaturationPercent')}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">{t('waitingForLiveData')}</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVitalsModalOpen(false)}>{t('close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveConsultation;