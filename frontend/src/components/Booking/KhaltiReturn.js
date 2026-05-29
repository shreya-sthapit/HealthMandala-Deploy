import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

// This page handles the redirect from Khalti after payment.
// Khalti appends: ?pidx=...&status=...&transaction_id=...&purchase_order_id=...
const KhaltiReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying your payment...');
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  // Guard against React StrictMode double-invocation and accidental re-renders
  const hasRun = useRef(false);

  useEffect(() => {
    // Ensure this only runs once per page load
    if (hasRun.current) return;
    hasRun.current = true;

    const verify = async () => {
      const pidx = searchParams.get('pidx');
      const status = searchParams.get('status');
      const purchaseOrderId = searchParams.get('purchase_order_id');

      if (!pidx) {
        setError('Invalid payment return. No payment reference found.');
        return;
      }

      // If Khalti says user cancelled, go back to booking
      if (status === 'User canceled') {
        setError('Payment was cancelled. Redirecting back...');
        setTimeout(() => navigate('/find-doctors'), 2500);
        return;
      }

      try {
        // Verify with backend
        const verifyRes = await fetch(API_BASE_URL + '/api/khalti/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pidx }),
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success || !verifyData.paid) {
          setError(`Payment not completed. Status: ${verifyData.status || 'Unknown'}. Redirecting back...`);
          setTimeout(() => navigate('/find-doctors'), 3000);
          return;
        }

        // Payment verified — retrieve pending appointment data from sessionStorage
        const pendingStr = sessionStorage.getItem('khaltiPendingAppointment');
        if (!pendingStr) {
          console.error('No pending appointment data found in sessionStorage');
          setError('Payment verified but booking data was lost. Please contact support.');
          return;
        }

        const { appointmentData, bookingState } = JSON.parse(pendingStr);
        console.log('Retrieved appointment data:', appointmentData);
        console.log('Retrieved booking state:', bookingState);

        // Save appointment
        const bookRes = await fetch(API_BASE_URL + '/api/appointments/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...appointmentData,
            paymentMethod: 'khalti',
            paymentStatus: 'paid',
            khaltiTransactionId: verifyData.transactionId,
            khaltiPidx: pidx,
          }),
        });
        const bookData = await bookRes.json();

        console.log('Booking response:', bookData);

        sessionStorage.removeItem('khaltiPendingAppointment');

        if (bookData.success) {
          // Show success popup
          setShowSuccessPopup(true);
          
          // Navigate to confirmation page after 3 seconds
          setTimeout(() => {
            navigate('/booking-confirmed', {
              state: {
                booking: bookingState,
                appointmentId: bookData.appointment.id,
                paymentStatus: 'paid',
                paymentMethod: 'khalti',
              },
            });
          }, 3000);
        } else {
          console.error('Booking failed:', bookData);
          setError(bookData.error || 'Payment succeeded but booking failed. Please contact support.');
        }
      } catch (err) {
        console.error('Khalti return error:', err);
        setError('Something went wrong verifying your payment. Please contact support.');
      }
    };

    verify();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease-in',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '3rem 2rem',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.4s ease-out',
          }}>
            {/* Success Icon */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              animation: 'scaleIn 0.5s ease-out',
            }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#00a896" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>

            {/* Success Message */}
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a2e35',
              marginBottom: '1rem',
            }}>
              Payment Successful!
            </h2>
            
            <p style={{
              fontSize: '1.1rem',
              color: '#64748b',
              lineHeight: '1.6',
            }}>
              Your payment has been processed and appointment confirmed
            </p>

            {/* Loading indicator */}
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#00a896',
              fontSize: '0.9rem',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #00a896',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span>Redirecting to confirmation page...</span>
            </div>
          </div>
        </div>
      )}

      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
      }}>
        {error ? (
          <>
            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
            <p style={{ color: '#dc2626', fontWeight: 600, textAlign: 'center', maxWidth: 500 }}>{error}</p>
            <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', maxWidth: 500 }}>
              Check the browser console for more details or contact support with your payment reference.
            </p>
          </>
        ) : !showSuccessPopup && (
          <>
            <div style={{
              width: 48, height: 48,
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #5c2d91',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#4a5568', fontWeight: 500 }}>{message}</p>
          </>
        )}
        <style>{`
          @keyframes spin { 
            to { transform: rotate(360deg); } 
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(30px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes scaleIn {
            from { 
              transform: scale(0);
            }
            to { 
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default KhaltiReturn;
