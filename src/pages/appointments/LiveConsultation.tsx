import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, PhoneOff, Mic, MicOff, VideoOff, AlertCircle, FilePlus, Notebook, ArrowLeft, Heart, User, Clock, MessageSquare, Activity, Settings, Users, Calendar, HeartPulse, Wind, Droplets } from 'lucide-react';
import api from '@/lib/api';
import { Appointment } from '@/types/appointment';
import { User as UserType } from '@/types/user';
import Peer from 'peerjs';
import { PrescriptionModal } from '@/components/prescription/PrescriptionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CreateMedicalRecordData } from '@/types/medicalRecord';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';

// Extend Window interface for tab coordination
declare global {
    interface Window {
        tabId?: string;
    }
}

const WS_URL = 'ws://localhost:5000';

const LiveConsultation: React.FC = () => {
    const { t } = useTranslation();
    const { appointmentId } = useParams<{ appointmentId: string }>();

    // Component State
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // WebRTC State
    const [peer, setPeer] = useState<Peer | null>(null);
    const [myPeerId, setMyPeerId] = useState<string | null>(null);
    const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState('Waiting for other user...');

    // Media Controls State
    const [isMicMuted, setMicMuted] = useState(false);
    const [isCameraOff, setCameraOff] = useState(false);

    // Refs for video elements and WebSocket
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const ws = useRef<WebSocket | null>(null);

    // Refs for stable instances
    const peerRef = useRef<Peer | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Tab coordination
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
    const isActiveTabRef = useRef<boolean>(false);

    // Prescription Modal State
    const [isPrescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
    const [isNoteModalOpen, setNoteModalOpen] = useState(false);
    const [note, setNote] = useState('');
    const [noteLoading, setNoteLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // New state for tabbed interface
    const [activeTab, setActiveTab] = useState<'notes' | 'records'>('notes');
    const [doctorNotes, setDoctorNotes] = useState<any[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [recordsError, setRecordsError] = useState<string | null>(null);

    // New state for live vitals
    const [isVitalsModalOpen, setVitalsModalOpen] = useState(false);
    const [vitals, setVitals] = useState<any>(null);
    const vitalsWsRef = useRef<WebSocket | null>(null);

    // Effect to fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            if (!appointmentId) return;
            setIsLoading(true);
            setError(null);
            try {
                const [appointmentData, currentUserData] = await Promise.all([
                    api.getAppointmentById(appointmentId),
                    api.getProfile()
                ]);

                // Debug logging
                console.log('=== LiveConsultation Debug ===');
                console.log('Appointment ID:', appointmentId);
                console.log('Current User Data:', currentUserData);
                console.log('Appointment Data:', appointmentData);
                console.log('Current User ID:', currentUserData._id);
                console.log('Patient ID:', appointmentData.patientId._id);
                console.log('Provider ID:', appointmentData.providerId._id);
                console.log('Is Patient?', currentUserData._id === appointmentData.patientId._id);
                console.log('Is Provider?', currentUserData._id === appointmentData.providerId._id);
                console.log('============================');

                // Ensure patientId and providerId are populated objects
                if (typeof appointmentData.patientId === 'string' || typeof appointmentData.providerId === 'string') {
                    throw new Error('Appointment data is not fully populated.');
                }

                setAppointment(appointmentData);
                setCurrentUser(currentUserData);
            } catch (err) {
                console.error('Failed to load consultation data', err);
                setError('Failed to load consultation data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [appointmentId, retryCount]);

    // Tab coordination effect
    useEffect(() => {
        if (!appointmentId || !currentUser) return;

        // Create broadcast channel for tab coordination - specific to this consultation and user
        const channelName = `consultation-${appointmentId}-${currentUser._id}`;
        broadcastChannelRef.current = new BroadcastChannel(channelName);

        // Listen for messages from other tabs of the same user in the same consultation
        const handleMessage = (event: MessageEvent) => {
            const { type, tabId, consultationId } = event.data;
            
            // Only respond to messages for this specific consultation
            if (consultationId !== appointmentId) return;
            
            if (type === 'TAB_ACTIVE' && tabId !== window.tabId) {
                // Another tab of the same user is active for this consultation, this tab should be inactive
                isActiveTabRef.current = false;
                toast.error('Another tab is handling this consultation. This tab will be inactive.');
            } else if (type === 'CALL_ENDED' && tabId !== window.tabId) {
                // Call was ended in another tab of the same user for this consultation
                handleEndCall();
            }
        };

        broadcastChannelRef.current.addEventListener('message', handleMessage);

        // Generate unique tab ID
        window.tabId = Math.random().toString(36).substr(2, 9);
        
        // Announce this tab as active for this specific consultation
        broadcastChannelRef.current.postMessage({
            type: 'TAB_ACTIVE',
            tabId: window.tabId,
            consultationId: appointmentId,
            userId: currentUser._id
        });

        isActiveTabRef.current = true;

        // Cleanup on unmount
        return () => {
            if (broadcastChannelRef.current) {
                broadcastChannelRef.current.close();
                broadcastChannelRef.current = null;
            }
        };
    }, [appointmentId, currentUser]);

    // Effect to get user media first
    useEffect(() => {
        if (isLoading || !appointment || !currentUser) return;

        let didCancel = false;
        let stream: MediaStream | null = null;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(mediaStream => {
                if (didCancel) {
                    mediaStream.getTracks().forEach(track => track.stop());
                } else {
                    stream = mediaStream;
                    setMyStream(mediaStream);
                }
            })
            .catch(err => {
                if (!didCancel) {
                    console.error('Failed to get user media', err);
                    setError('Could not access camera and microphone. Please check permissions and try again.');
                }
            });

        return () => {
            didCancel = true;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isLoading, appointment, currentUser]);

    // Effect to attach local stream to the video element
    useEffect(() => {
        if (myStream && myVideoRef.current) {
            myVideoRef.current.srcObject = myStream;
        }
    }, [myStream]);

    // Effect to attach remote stream to the video element
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Effect to initialize WebRTC peer connection
    useEffect(() => {
        if (!appointment || !currentUser || !myStream) return;

        const newPeer = new Peer();
        setPeer(newPeer);
        peerRef.current = newPeer;

        newPeer.on('open', (id) => {
            setMyPeerId(id);
            console.log('My peer ID:', id);
        });

        newPeer.on('call', (call) => {
            call.answer(myStream);
            call.on('stream', (remoteVideoStream) => {
                setRemoteStream(remoteVideoStream);
                setStatus('Connected');
            });
        });

        newPeer.on('error', (err) => {
            console.error('Peer error:', err);
            setError('Connection error. Please try refreshing the page.');
        });

        return () => {
            newPeer.destroy();
        };
    }, [appointment, currentUser, myStream]);

    // Effect to connect to WebSocket for signaling
    useEffect(() => {
        if (!appointment || !currentUser || !myPeerId) return;

        const websocket = new WebSocket(WS_URL);
        wsRef.current = websocket;

        websocket.onopen = () => {
            console.log('WebSocket connected');
            websocket.send(JSON.stringify({
                type: 'JOIN_CONSULTATION',
                appointmentId,
                userId: currentUser._id,
                peerId: myPeerId
            }));
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'PEER_JOINED' && data.peerId !== myPeerId) {
                setRemotePeerId(data.peerId);
                setStatus('Connecting...');
                
                // Call the remote peer
                if (peerRef.current && myStream) {
                    const call = peerRef.current.call(data.peerId, myStream);
                    call.on('stream', (remoteVideoStream) => {
                        setRemoteStream(remoteVideoStream);
                        setStatus('Connected');
                    });
                }
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            websocket.close();
        };
    }, [appointment, currentUser, myPeerId]);

    // Effect to fetch doctor notes and medical records for providers
    useEffect(() => {
        if (!appointment || !currentUser || currentUser._id !== appointment.providerId._id) return;

        const fetchNotes = async () => {
            setNotesLoading(true);
            try {
                const notes = await api.getDoctorNotes(appointment.patientId._id);
                setDoctorNotes(notes);
            } catch (err) {
                setNotesError('Failed to load notes');
            } finally {
                setNotesLoading(false);
            }
        };

        const fetchRecords = async () => {
            setRecordsLoading(true);
            try {
                const records = await api.getPatientMedicalHistory(appointment.patientId._id);
                setMedicalRecords(records);
            } catch (err) {
                setRecordsError('Failed to load medical records');
            } finally {
                setRecordsLoading(false);
            }
        };

        fetchNotes();
        fetchRecords();
    }, [appointment, currentUser]);

    // Effect: subscribe to live vitals when modal is open
    useEffect(() => {
        if (!isVitalsModalOpen || !appointment) return;
        const vitalsWs: WebSocket = new WebSocket(WS_URL);
        vitalsWsRef.current = vitalsWs;
        vitalsWs.onopen = () => {
            vitalsWs.send(JSON.stringify({ type: 'join-room', appointmentId: appointment._id, role: 'doctor' }));
        };
        vitalsWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'vital-data') {
                setVitals(data.payload);
            }
        };
        return () => { 
            if (vitalsWs.readyState === WebSocket.OPEN) {
                vitalsWs.close();
            }
        };
    }, [isVitalsModalOpen, appointment]);

    const toggleMic = () => {
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCameraOff(!videoTrack.enabled);
            }
        }
    };

    const handleEndCall = () => {
        // Notify other tabs that call is ending
        if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
                type: 'CALL_ENDED',
                tabId: window.tabId,
                consultationId: appointmentId
            });
        }

        // Stop all media tracks
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (peerRef.current) {
            peerRef.current.destroy();
        }

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
        }

        toast.success('Call ended successfully');
        window.location.href = '/dashboard/' + (currentUser?.role || 'patient');
    };

    const handleCreateNote = async () => {
        if (!note.trim() || !appointment) return;
        
        setNoteLoading(true);
        try {
            const noteData: CreateMedicalRecordData = {
                patientId: appointment.patientId._id,
                type: 'consultation',
                title: 'Doctor Note',
                date: new Date().toISOString(),
                details: {
                    note: note.trim(),
                    privacy: 'doctor-only'
                }
            };
            
            await api.createMedicalRecord(noteData);
            toast.success('Note saved successfully');
            setNote('');
            setNoteModalOpen(false);
            
            // Refresh notes
            const notes = await api.getDoctorNotes(appointment.patientId._id);
            setDoctorNotes(notes);
        } catch (error) {
            toast.error('Failed to save note');
        } finally {
            setNoteLoading(false);
        }
    };

    const handlePrescriptionCreated = () => {
        toast.success('Prescription created successfully');
        setPrescriptionModalOpen(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('initializingConsultation')}</p>
                </div>
            </div>
        );
    }

    if (error || !appointment || !currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('connectionError')}</h2>
                    <p className="text-gray-600 mb-4">{error || t('unableToLoadConsultationData')}</p>
                    <Button onClick={() => window.history.back()} className="bg-blue-600 hover:bg-blue-700">
                        {t('goBack')}
                    </Button>
                </div>
            </div>
        );
    }

    console.log('=== Render Debug ===');
    console.log('Appointment:', appointment);
    console.log('Current User:', currentUser);
    console.log('Patient ID:', appointment.patientId._id);
    console.log('Provider ID:', appointment.providerId._id);
    console.log('Current User Role:', currentUser.role);
    console.log('Patient Role:', appointment.patientId.role);
    console.log('Provider Role:', appointment.providerId.role);
    console.log('=============================');

    const isPatient = currentUser._id === appointment.patientId._id;
    
    const patientName = `${appointment.patientId.firstName} ${appointment.patientId.lastName}`;
    const doctorName = `Dr. ${appointment.providerId.firstName} ${appointment.providerId.lastName}`;
    
    // Determine which video feed is which
    const localVideoTitle = isPatient ? patientName : doctorName;
    const remoteVideoTitle = isPatient ? doctorName : patientName;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => window.history.back()}
                                className="flex items-center space-x-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>{t('back')}</span>
                            </Button>
                            <Link to="/" className="flex items-center group">
                                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg group-hover:scale-105 transition-transform">
                                    <Heart className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-3">
                                  SehatyNet+
                                </span>
                            </Link>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {!isActiveTabRef.current && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    ⚠️ {t('inactiveTab')}
                                </Badge>
                            )}
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <span className="text-sm text-gray-600">{t('appointmentId')}: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{appointmentId}</span></span>
                            </div>
                            <Button 
                                variant="destructive" 
                                onClick={handleEndCall} 
                                disabled={!isActiveTabRef.current}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <PhoneOff className="h-4 w-4 mr-2" />
                                End Call
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
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center text-white">
                                                <VideoOff className="h-16 w-16 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm opacity-75">Camera not available</p>
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
                                        {status === 'Connected' && <Badge className="bg-green-100 text-green-800 text-xs">Live</Badge>}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
                                        {remoteStream ? (
                                            <video 
                                                playsInline 
                                                ref={remoteVideoRef} 
                                                autoPlay 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center text-white">
                                                <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm opacity-75">Waiting for connection...</p>
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
                                    <Button 
                                        variant={isMicMuted ? "destructive" : "outline"} 
                                        size="lg" 
                                        onClick={toggleMic} 
                                        disabled={!isActiveTabRef.current}
                                        className="w-16 h-16 rounded-full"
                                    >
                                        {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                    </Button>
                                    
                                    <Button 
                                        variant="destructive" 
                                        size="lg" 
                                        onClick={handleEndCall} 
                                        disabled={!isActiveTabRef.current}
                                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
                                    >
                                        <PhoneOff className="h-6 w-6" />
                                    </Button>
                                    
                                    <Button 
                                        variant={isCameraOff ? "destructive" : "outline"} 
                                        size="lg" 
                                        onClick={toggleCamera} 
                                        disabled={!isActiveTabRef.current}
                                        className="w-16 h-16 rounded-full"
                                    >
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
                                                {isPatient ? 
                                                    appointment.patientId.firstName?.charAt(0) : 
                                                    appointment.providerId.firstName?.charAt(0)
                                                }
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {isPatient ? patientName : doctorName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {isPatient ? t('patient') : t('healthcareProvider')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span className="text-gray-600">
                                                {new Date(appointment.scheduledDate).toLocaleDateString()}
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
                                        <Button 
                                            className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                                            onClick={() => setPrescriptionModalOpen(true)} 
                                            disabled={!isActiveTabRef.current}
                                        >
                                            <FilePlus className="h-4 w-4 mr-2" /> 
                                            {t('createPrescription')}
                                        </Button>
                                        <Button 
                                            className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                                            onClick={() => setNoteModalOpen(true)} 
                                            disabled={!isActiveTabRef.current}
                                        >
                                            <Notebook className="h-4 w-4 mr-2" /> 
                                            {t('addNote')}
                                        </Button>
                                        <Button
                                            className="w-full justify-start bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700"
                                            onClick={() => setVitalsModalOpen(true)}
                                            disabled={!isActiveTabRef.current}
                                        >
                                            <HeartPulse className="h-4 w-4 mr-2" />
                                            {t('viewLiveVitals')}
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
                                                {status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{t('audio')}</span>
                                            <Badge variant={isMicMuted ? "destructive" : "default"}>
                                                {isMicMuted ? t('muted') : t('active')}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{t('video')}</span>
                                            <Badge variant={isCameraOff ? "destructive" : "default"}>
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
                            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "notes" | "records")} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="notes" className="flex items-center space-x-2">
                                        <Notebook className="h-4 w-4" />
                                        <span>{t('notesHistory')}</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="records" className="flex items-center space-x-2">
                                        <Activity className="h-4 w-4" />
                                        <span>{t('medicalRecordsLabel')}</span>
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="notes" className="mt-6">
                                    {notesLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <p className="text-gray-600">{t('loadingNotes')}</p>
                                        </div>
                                    ) : notesError ? (
                                        <div className="text-center py-8">
                                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                            <p className="text-red-600">{notesError}</p>
                                        </div>
                                    ) : doctorNotes.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Notebook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500">{t('noNotesFound')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {doctorNotes.map(note => (
                                                <Card key={note._id} className="border border-gray-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(note.date).toLocaleString()} {t('by')} {note.providerId?.firstName} {note.providerId?.lastName}
                                                            </div>
                                                            <Badge variant="outline" className="text-xs">{t('private')}</Badge>
                                                        </div>
                                                        <div className="font-semibold text-gray-900 mb-2">{note.title}</div>
                                                        <div className="text-gray-700">
                                                            {typeof note.details === 'object' && note.details !== null && 'note' in note.details
                                                                ? note.details.note
                                                                : typeof note.details === 'string'
                                                                    ? note.details
                                                                    : ''}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                                
                                <TabsContent value="records" className="mt-6">
                                    {recordsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <p className="text-gray-600">{t('loadingMedicalRecords')}</p>
                                        </div>
                                    ) : recordsError ? (
                                        <div className="text-center py-8">
                                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                            <p className="text-red-600">{recordsError}</p>
                                        </div>
                                    ) : medicalRecords.length === 0 ? (
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
                                                        <TableHead>{t('type')}</TableHead>
                                                        <TableHead>{t('title')}</TableHead>
                                                        <TableHead>{t('provider')}</TableHead>
                                                        <TableHead>{t('actions')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {medicalRecords.map(record => (
                                                        <TableRow key={record._id}>
                                                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{record.type}</Badge>
                                                            </TableCell>
                                                            <TableCell>{record.title}</TableCell>
                                                            <TableCell>{record.providerId?.firstName} {record.providerId?.lastName}</TableCell>
                                                            <TableCell>
                                                                <Button asChild size="sm" variant="outline">
                                                                    <Link to={`/medical-records/${record._id}`}>{t('viewDetails')}</Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
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
                onPrescriptionCreated={handlePrescriptionCreated}
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
                        <Button 
                            onClick={handleCreateNote} 
                            disabled={noteLoading || !note.trim()}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
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
                                <Droplets className="h-8 w-8 text-indigo-500 mb-1" />
                                <span className="font-bold text-lg">{vitals.spo2 ?? '--'}</span>
                                <span className="text-xs text-gray-500">{t('spo2Percent')}</span>
                            </div>
                            {/* Add more vitals as needed */}
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