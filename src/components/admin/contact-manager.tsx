"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Upload, Loader2, Plus, Sparkles, Edit2, X, FileText, Phone, Mail, MapPin, Briefcase, Link as LinkIcon, MessageCircle, Eye, EyeOff } from "lucide-react";
import { updatePersonInfo, type getPersonInfo } from "@/app/actions/contact";
import { uploadCV } from "@/app/actions/upload";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { COUNTRIES, getCountryByCode, getCountryByDialCode } from "@/lib/countries";
import { DEFAULT_SECTION_INTROS } from "@/lib/section-intros";
import { validateEmail, validatePhone as validatePhoneUtil, formatPhoneToE164, trimAndValidate } from "@/lib/contact-validation";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";
import { CharCounter } from "@/components/ui/char-counter";

type PersonInfo = Awaited<ReturnType<typeof getPersonInfo>>;

type UserDefaults = {
  name: string;
  email: string;
} | null;

export function ContactManager({
  initialData,
  userDefaults,
  isReadOnly = false,
  platformMenuId,
}: {
  initialData: PersonInfo | null;
  userDefaults?: UserDefaults;
  isReadOnly?: boolean;
  platformMenuId: string;
}) {
  const [personInfo, setPersonInfo] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Extract filename from CV URL if it exists
  const getFilenameFromUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const parts = url.split("/");
    return parts[parts.length - 1] || null;
  };
  
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    getFilenameFromUrl(initialData?.cvUrl)
  );
  
  // Get smart defaults: use existing data if available and not empty, otherwise use user defaults
  const getSmartDefaults = () => {
    const existingName = initialData?.name?.trim();
    const existingEmail = initialData?.email?.trim();
    // Backward compatibility: use legacy email/phone if new fields don't exist
    const email1 = initialData?.email1 || initialData?.email || "";
    const phone1 = initialData?.phone1 || initialData?.phone || "";
    return {
      name: existingName || userDefaults?.name || "",
      email: existingEmail || userDefaults?.email || "", // Legacy field
      role: initialData?.role || "",
      location: initialData?.location || "",
      linkedIn: initialData?.linkedIn || "",
      phone: phone1, // Legacy field
      contactMessage: initialData?.contactMessage || DEFAULT_SECTION_INTROS.contact,
      cvUrl: initialData?.cvUrl || "",
      // Extended fields
      phone1: phone1,
      phone2: initialData?.phone2 || "",
      whatsapp: initialData?.whatsapp || "",
      email1: email1 || userDefaults?.email || "",
      email2: initialData?.email2 || "",
      // Visibility
      showPhone1: initialData?.showPhone1 ?? true,
      showPhone2: initialData?.showPhone2 ?? true,
      showWhatsApp: initialData?.showWhatsApp ?? true,
      showEmail1: initialData?.showEmail1 ?? true,
      showEmail2: initialData?.showEmail2 ?? true,
    };
  };
  
  const [formData, setFormData] = useState(getSmartDefaults());

  // Helper to initialize phone state from E.164 number
  const initializePhoneState = (phone: string | null | undefined) => {
    if (!phone) {
      return { country: "US", number: "" };
    }
    try {
      const parsed = parsePhoneNumber(phone);
      return {
        country: parsed.country || "US",
        number: parsed.nationalNumber || "",
      };
    } catch {
      // Fallback: try to extract manually
      const match = phone.match(/^(\+\d{1,4})(.+)$/);
      if (match) {
        const dialCode = match[1];
        const country = getCountryByDialCode(dialCode);
        return {
          country: country.code,
          number: match[2].replace(/\s/g, ""),
        };
      }
      return { country: "US", number: phone.replace(/^\+\d+/, "") };
    }
  };

  // Phone input state (for phone1 - legacy)
  const initialPhoneState = initializePhoneState(initialData?.phone1 || initialData?.phone);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialPhoneState.country);
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneState.number);
  
  // Phone2 state
  const initialPhone2State = initializePhoneState(initialData?.phone2);
  const [selectedCountry2, setSelectedCountry2] = useState<string>(initialPhone2State.country);
  const [phoneNumber2, setPhoneNumber2] = useState<string>(initialPhone2State.number);
  const [phoneError2, setPhoneError2] = useState<string | null>(null);
  
  // WhatsApp state
  const initialWhatsAppState = initializePhoneState(initialData?.whatsapp);
  const [selectedCountryWhatsApp, setSelectedCountryWhatsApp] = useState<string>(initialWhatsAppState.country);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(initialWhatsAppState.number);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  
  // Email validation errors
  const [email1Error, setEmail1Error] = useState<string | null>(null);
  const [email2Error, setEmail2Error] = useState<string | null>(null);
  
  // Length validation errors
  const [nameLengthError, setNameLengthError] = useState<string | null>(null);
  const [roleLengthError, setRoleLengthError] = useState<string | null>(null);
  const [locationLengthError, setLocationLengthError] = useState<string | null>(null);
  const [contactMessageLengthError, setContactMessageLengthError] = useState<string | null>(null);
  const [linkedInLengthError, setLinkedInLengthError] = useState<string | null>(null);

  // Validate phone number
  const validatePhone = (phone: string): string | null => {
    if (!phone || phone.trim() === "") {
      return null; // Optional field, empty is valid
    }
    
    try {
      if (!isValidPhoneNumber(phone)) {
        // Try to get more specific error
        try {
          const parsed = parsePhoneNumber(phone);
          return `Invalid phone number format for ${parsed.country || "selected country"}`;
        } catch {
          return "Invalid phone number format. Please check the number and country code.";
        }
      }
      return null; // Valid
    } catch (error) {
      return "Invalid phone number format. Please check the number and country code.";
    }
  };

  // Format phone for display
  const formatPhoneForDisplay = (phone: string | null | undefined): string => {
    if (!phone) return "Not provided";
    try {
      const parsed = parsePhoneNumber(phone);
      return parsed.formatInternational();
    } catch {
      return phone; // Fallback to raw value
    }
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setPhoneError(null);
  };

  const handlePhoneNumberChange = (value: string) => {
    // Only allow digits, spaces, dashes, parentheses
    const cleaned = value.replace(/[^\d\s\-()]/g, "");
    setPhoneNumber(cleaned);
    // Don't clear error immediately - let validation handle it
  };

  // Build full phone number with country code
  const getFullPhoneNumber = (): string => {
    if (!phoneNumber.trim()) return "";
    const country = getCountryByCode(selectedCountry);
    return `${country.dialCode}${phoneNumber.replace(/\s/g, "")}`;
  };

  // Helper to build full phone number with country code
  const getFullPhoneNumber2 = (number: string, country: string): string => {
    if (!number.trim()) return "";
    const countryObj = getCountryByCode(country);
    return `${countryObj.dialCode}${number.replace(/\s/g, "")}`;
  };

  // Debounced validation for phone1
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!phoneNumber.trim()) {
        setPhoneError(null);
        return;
      }
      const fullPhone = getFullPhoneNumber();
      if (fullPhone && fullPhone.length > 5) { // Only validate if phone has enough digits
        const validation = validatePhoneUtil(fullPhone, selectedCountry);
        setPhoneError(validation.error);
      } else {
        setPhoneError(null);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [phoneNumber, selectedCountry]);
  
  // Debounced validation for phone2
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!phoneNumber2.trim()) {
        setPhoneError2(null);
        return;
      }
      const fullPhone = getFullPhoneNumber2(phoneNumber2, selectedCountry2);
      if (fullPhone && fullPhone.length > 5) { // Only validate if phone has enough digits
        const validation = validatePhoneUtil(fullPhone, selectedCountry2);
        setPhoneError2(validation.error);
      } else {
        setPhoneError2(null);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [phoneNumber2, selectedCountry2]);
  
  // Debounced validation for WhatsApp
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!whatsappNumber.trim()) {
        setWhatsappError(null);
        return;
      }
      const fullPhone = getFullPhoneNumber2(whatsappNumber, selectedCountryWhatsApp);
      if (fullPhone && fullPhone.length > 5) { // Only validate if phone has enough digits
        const validation = validatePhoneUtil(fullPhone, selectedCountryWhatsApp);
        setWhatsappError(validation.error);
      } else {
        setWhatsappError(null);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [whatsappNumber, selectedCountryWhatsApp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setPhoneError(null);
    setPhoneError2(null);
    setWhatsappError(null);
    setEmail1Error(null);
    setEmail2Error(null);
    setNameLengthError(null);
    setRoleLengthError(null);
    setLocationLengthError(null);
    setLinkedInLengthError(null);
    setContactMessageLengthError(null);
    
    // Validate text lengths
    const nameValidation = validateTextLength(formData.name, TEXT_LIMITS.NAME, "Name");
    if (!nameValidation.isValid) {
      setNameLengthError(nameValidation.error);
      return;
    }
    
    const roleValidation = validateTextLength(formData.role, TEXT_LIMITS.TITLE, "Role");
    if (!roleValidation.isValid) {
      setRoleLengthError(roleValidation.error);
      return;
    }
    
    const locationValidation = validateTextLength(formData.location, TEXT_LIMITS.LABEL, "Location");
    if (!locationValidation.isValid) {
      setLocationLengthError(locationValidation.error);
      return;
    }
    
    const linkedInValidation = validateTextLength(formData.linkedIn, TEXT_LIMITS.URL, "LinkedIn URL");
    if (!linkedInValidation.isValid) {
      setLinkedInLengthError(linkedInValidation.error);
      return;
    }
    
    if (formData.contactMessage) {
      const contactMessageValidation = validateTextLength(formData.contactMessage, TEXT_LIMITS.CONTACT_MESSAGE, "Contact message");
      if (!contactMessageValidation.isValid) {
        setContactMessageLengthError(contactMessageValidation.error);
        return;
      }
    }
    
    // Validate LinkedIn URL format
    if (formData.linkedIn && !formData.linkedIn.match(/^https?:\/\/.+/)) {
      setUploadError("LinkedIn URL must start with http:// or https://");
      return;
    }
    
    // Validate emails (real-time validation should catch these, but double-check)
    // Email1 is required if no phone numbers are provided
    const trimmedEmail1 = formData.email1?.trim() || "";
    const hasAnyPhone = phoneNumber.trim() || phoneNumber2.trim() || whatsappNumber.trim();
    
    if (!trimmedEmail1 && !hasAnyPhone) {
      setEmail1Error("At least one contact method (email or phone) is required");
      return;
    }
    
    if (trimmedEmail1) {
      const email1Validation = validateEmail(trimmedEmail1);
      if (!email1Validation.isValid) {
        setEmail1Error(email1Validation.error || "Invalid email format");
        return;
      }
    }
    
    if (formData.email2?.trim()) {
      const email2Validation = validateEmail(formData.email2.trim());
      if (!email2Validation.isValid) {
        setEmail2Error(email2Validation.error || "Invalid email format");
        return;
      }
    }
    
    // Validate phone numbers
    const fullPhone1 = getFullPhoneNumber();
    if (fullPhone1) {
      const phone1Validation = validatePhoneUtil(fullPhone1, selectedCountry);
      if (!phone1Validation.isValid) {
        setPhoneError(phone1Validation.error || "Invalid phone number format");
        return;
      }
    }
    
    const fullPhone2 = getFullPhoneNumber2(phoneNumber2, selectedCountry2);
    if (fullPhone2) {
      const phone2Validation = validatePhoneUtil(fullPhone2, selectedCountry2);
      if (!phone2Validation.isValid) {
        setPhoneError2(phone2Validation.error || "Invalid phone number format");
        return;
      }
    }
    
    const fullWhatsApp = getFullPhoneNumber2(whatsappNumber, selectedCountryWhatsApp);
    if (fullWhatsApp) {
      const whatsappValidation = validatePhoneUtil(fullWhatsApp, selectedCountryWhatsApp);
      if (!whatsappValidation.isValid) {
        setWhatsappError(whatsappValidation.error || "Invalid WhatsApp number format");
        return;
      }
    }
    
    // Normalize phones to E.164 format
    const normalizedPhone1 = fullPhone1 ? formatPhoneToE164(fullPhone1, selectedCountry) : null;
    const normalizedPhone2 = fullPhone2 ? formatPhoneToE164(fullPhone2, selectedCountry2) : null;
    const normalizedWhatsApp = fullWhatsApp ? formatPhoneToE164(fullWhatsApp, selectedCountryWhatsApp) : null;
    
    // Trim and normalize emails
    const trimmedEmail1Final = trimmedEmail1 || null;
    const trimmedEmail2Final = trimAndValidate(formData.email2).trimmed || null;
    
    // Final check: at least one contact method must exist
    if (!trimmedEmail1Final && !normalizedPhone1 && !normalizedPhone2 && !normalizedWhatsApp) {
      setUploadError("At least one contact method (email or phone) is required");
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await updatePersonInfo({
        platformMenuId,
        name: formData.name.trim(),
        role: formData.role.trim(),
        location: formData.location.trim(),
        email: trimmedEmail1Final || formData.email.trim(), // Legacy field
        linkedIn: formData.linkedIn.trim(),
        phone: normalizedPhone1, // Legacy field
        contactMessage: formData.contactMessage?.trim() || null,
        cvUrl: formData.cvUrl || null,
        avatarUrl: personInfo?.avatarUrl || null, // Preserve existing avatar
        // Extended fields
        phone1: normalizedPhone1,
        phone2: normalizedPhone2,
        whatsapp: normalizedWhatsApp,
        email1: trimmedEmail1Final,
        email2: trimmedEmail2Final,
        // Visibility
        showPhone1: formData.showPhone1,
        showPhone2: formData.showPhone2,
        showWhatsApp: formData.showWhatsApp,
        showEmail1: formData.showEmail1,
        showEmail2: formData.showEmail2,
      });
      setPersonInfo(result);
      setIsEditing(false);
      setIsCreating(false);
      setUploadError(null);
      setPhoneError(null);
      setPhoneError2(null);
      setWhatsappError(null);
      setEmail1Error(null);
      setEmail2Error(null);
      // Update form data with saved values to ensure consistency
      const phone1State = initializePhoneState(result.phone1 || result.phone);
      const phone2State = initializePhoneState(result.phone2);
      const whatsappState = initializePhoneState(result.whatsapp);
      
      setFormData({
        name: result.name,
        email: result.email1 || result.email || "",
        role: result.role,
        location: result.location,
        linkedIn: result.linkedIn,
        phone: result.phone1 || result.phone || "",
        contactMessage: result.contactMessage || "",
        cvUrl: result.cvUrl || "",
        phone1: result.phone1 || result.phone || "",
        phone2: result.phone2 || "",
        whatsapp: result.whatsapp || "",
        email1: result.email1 || result.email || "",
        email2: result.email2 || "",
        showPhone1: result.showPhone1 ?? true,
        showPhone2: result.showPhone2 ?? true,
        showWhatsApp: result.showWhatsApp ?? true,
        showEmail1: result.showEmail1 ?? true,
        showEmail2: result.showEmail2 ?? true,
      });
      
      // Update phone states
      setSelectedCountry(phone1State.country);
      setPhoneNumber(phone1State.number);
      setSelectedCountry2(phone2State.country);
      setPhoneNumber2(phone2State.number);
      setSelectedCountryWhatsApp(whatsappState.country);
      setWhatsappNumber(whatsappState.number);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to save contact information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const result = await uploadCV(uploadFormData);
      
      // Update the form with the new CV URL and filename
      const updatedFormData = { ...formData, cvUrl: result.cvUrl };
      setFormData(updatedFormData);
      setUploadedFileName(result.filename || null);
      
      // Also update personInfo in database
      const updatedPersonInfo = await updatePersonInfo({
        platformMenuId,
        name: updatedFormData.name.trim(),
        role: updatedFormData.role.trim(),
        location: updatedFormData.location.trim(),
        email: updatedFormData.email1 || updatedFormData.email || "",
        linkedIn: updatedFormData.linkedIn.trim(),
        phone: updatedFormData.phone1 || updatedFormData.phone || null,
        contactMessage: updatedFormData.contactMessage?.trim() || null,
        cvUrl: updatedFormData.cvUrl || null,
        avatarUrl: personInfo?.avatarUrl || null,
        phone1: updatedFormData.phone1 || null,
        phone2: updatedFormData.phone2 || null,
        whatsapp: updatedFormData.whatsapp || null,
        email1: updatedFormData.email1 || null,
        email2: updatedFormData.email2 || null,
        showPhone1: updatedFormData.showPhone1,
        showPhone2: updatedFormData.showPhone2,
        showWhatsApp: updatedFormData.showWhatsApp,
        showEmail1: updatedFormData.showEmail1,
        showEmail2: updatedFormData.showEmail2,
      });
      setPersonInfo(updatedPersonInfo);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload CV");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  if (!personInfo && !isEditing) {
    return (
      <div className="border border-border bg-panel rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
        </div>
        <p className="text-sm text-muted">No profile yet for this portfolio.</p>
        <button
            onClick={() => {
              setIsCreating(true);
              setIsEditing(true);
              // Pre-fill with smart defaults when creating
              setFormData(getSmartDefaults());
              // Reset phone state
              setSelectedCountry("US");
              setPhoneNumber("");
            }}
          disabled={isReadOnly}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Create profile
        </button>
      </div>
    );
  }

  // VIEW MODE - Show all saved data
  if (!isEditing && personInfo) {
    return (
      <div className="border border-border bg-panel rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
          <button
            onClick={() => {
              setIsCreating(false);
              setIsEditing(true);
              // When editing, pre-fill with current data
              const phone1State = initializePhoneState(personInfo?.phone1 || personInfo?.phone);
              const phone2State = initializePhoneState(personInfo?.phone2);
              const whatsappState = initializePhoneState(personInfo?.whatsapp);
              
              setFormData({
                name: personInfo?.name?.trim() || "",
                email: personInfo?.email1 || personInfo?.email?.trim() || "",
                role: personInfo?.role || "",
                location: personInfo?.location || "",
                linkedIn: personInfo?.linkedIn || "",
                phone: personInfo?.phone1 || personInfo?.phone || "",
                contactMessage: personInfo?.contactMessage || "",
                cvUrl: personInfo?.cvUrl || "",
                phone1: personInfo?.phone1 || personInfo?.phone || "",
                phone2: personInfo?.phone2 || "",
                whatsapp: personInfo?.whatsapp || "",
                email1: personInfo?.email1 || personInfo?.email?.trim() || "",
                email2: personInfo?.email2 || "",
                showPhone1: personInfo?.showPhone1 ?? true,
                showPhone2: personInfo?.showPhone2 ?? true,
                showWhatsApp: personInfo?.showWhatsApp ?? true,
                showEmail1: personInfo?.showEmail1 ?? true,
                showEmail2: personInfo?.showEmail2 ?? true,
              });
              // Initialize phone states
              setSelectedCountry(phone1State.country);
              setPhoneNumber(phone1State.number);
              setSelectedCountry2(phone2State.country);
              setPhoneNumber2(phone2State.number);
              setSelectedCountryWhatsApp(whatsappState.country);
              setWhatsappNumber(whatsappState.number);
            }}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel2 text-foreground rounded-lg hover:bg-panel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">Name</p>
              <p className="text-sm font-medium text-foreground">{personInfo.name || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">Role</p>
              <p className="text-sm font-medium text-foreground">{personInfo.role || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">Location</p>
              <p className="text-sm font-medium text-foreground">{personInfo.location || "Not provided"}</p>
            </div>
          </div>

          {/* Email 1 (Primary) */}
          {(personInfo.email1 || personInfo.email) && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted mb-1">Primary Email</p>
                  {personInfo.showEmail1 ? (
                    <Eye className="h-3 w-3 text-green-400" title="Visible on portfolio" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted" title="Hidden from portfolio" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{personInfo.email1 || personInfo.email}</p>
              </div>
            </div>
          )}
          
          {/* Email 2 (Secondary) */}
          {personInfo.email2 && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted mb-1">Secondary Email</p>
                  {personInfo.showEmail2 ? (
                    <Eye className="h-3 w-3 text-green-400" title="Visible on portfolio" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted" title="Hidden from portfolio" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{personInfo.email2}</p>
              </div>
            </div>
          )}

          {/* Phone 1 (Primary) */}
          {(personInfo.phone1 || personInfo.phone) && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted mb-1">Primary Phone</p>
                  {personInfo.showPhone1 ? (
                    <Eye className="h-3 w-3 text-green-400" title="Visible on portfolio" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted" title="Hidden from portfolio" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{formatPhoneForDisplay(personInfo.phone1 || personInfo.phone)}</p>
              </div>
            </div>
          )}
          
          {/* Phone 2 (Secondary) */}
          {personInfo.phone2 && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted mb-1">Secondary Phone</p>
                  {personInfo.showPhone2 ? (
                    <Eye className="h-3 w-3 text-green-400" title="Visible on portfolio" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted" title="Hidden from portfolio" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{formatPhoneForDisplay(personInfo.phone2)}</p>
              </div>
            </div>
          )}
          
          {/* WhatsApp */}
          {personInfo.whatsapp && (
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted mb-1">WhatsApp</p>
                  {personInfo.showWhatsApp ? (
                    <Eye className="h-3 w-3 text-green-400" title="Visible on portfolio" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted" title="Hidden from portfolio" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{formatPhoneForDisplay(personInfo.whatsapp)}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <LinkIcon className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">LinkedIn</p>
              {personInfo.linkedIn ? (
                <a 
                  href={personInfo.linkedIn} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:text-blue-400 transition-colors"
                >
                  {personInfo.linkedIn}
                </a>
              ) : (
                <p className="text-sm font-medium text-foreground">Not provided</p>
              )}
            </div>
          </div>

          {personInfo.cvUrl && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted mb-1">CV/Resume</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{getFilenameFromUrl(personInfo.cvUrl) || "CV uploaded"}</p>
                  <a
                    href={personInfo.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:text-blue-400 transition-colors"
                  >
                    View
                  </a>
                </div>
              </div>
            </div>
          )}

          {personInfo.contactMessage && (
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted mb-1">Contact Message</p>
                <p className="text-sm text-foreground">{personInfo.contactMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">Contact Information</h2>
        <button
          onClick={() => {
            setIsEditing(false);
            setIsCreating(false);
            setUploadError(null);
            setPhoneError(null);
              // Reset form data to saved values
              if (personInfo) {
                setFormData({
                  name: personInfo.name || "",
                  email: personInfo.email || "",
                  role: personInfo.role || "",
                  location: personInfo.location || "",
                  linkedIn: personInfo.linkedIn || "",
                  phone: personInfo.phone || "",
                  contactMessage: personInfo.contactMessage || "",
                  cvUrl: personInfo.cvUrl || "",
                });
                // Reset phone state
                const phoneState = initializePhoneState(personInfo.phone);
                setSelectedCountry(phoneState.country);
                setPhoneNumber(phoneState.number);
              }
          }}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border bg-panel2 text-foreground rounded-lg hover:bg-panel transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>

      {uploadError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{uploadError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            maxLength={TEXT_LIMITS.NAME}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, name: value });
              const validation = validateTextLength(value, TEXT_LIMITS.NAME, "Name");
              setNameLengthError(validation.error);
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              nameLengthError
                ? "border-red-500 bg-red-500/10 focus:ring-red-500 focus:border-red-500"
                : "border-border bg-background text-foreground focus:ring-accent focus:border-accent"
            }`}
            required
            disabled={isSaving}
          />
          <CharCounter current={formData.name.length} max={TEXT_LIMITS.NAME} />
          {nameLengthError && (
            <p className="mt-1 text-xs text-red-400">{nameLengthError}</p>
          )}
          {userDefaults && formData.name === userDefaults.name && !initialData?.name?.trim() && (
            <p className="mt-1.5 text-xs text-muted flex items-center gap-1.5 animate-pulse">
              <Sparkles className="h-3 w-3 text-accent" />
              <span>Suggested from your account</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Role</label>
          <input
            type="text"
            value={formData.role}
            maxLength={TEXT_LIMITS.TITLE}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, role: value });
              const validation = validateTextLength(value, TEXT_LIMITS.TITLE, "Role");
              setRoleLengthError(validation.error);
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              roleLengthError
                ? "border-red-500 bg-red-500/10 focus:ring-red-500 focus:border-red-500"
                : "border-border bg-background text-foreground focus:ring-accent focus:border-accent"
            }`}
            required
            disabled={isSaving}
          />
          <CharCounter current={formData.role.length} max={TEXT_LIMITS.TITLE} />
          {roleLengthError && (
            <p className="mt-1 text-xs text-red-400">{roleLengthError}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            maxLength={TEXT_LIMITS.LABEL}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, location: value });
              const validation = validateTextLength(value, TEXT_LIMITS.LABEL, "Location");
              setLocationLengthError(validation.error);
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              locationLengthError
                ? "border-red-500 bg-red-500/10 focus:ring-red-500 focus:border-red-500"
                : "border-border bg-background text-foreground focus:ring-accent focus:border-accent"
            }`}
            required
            disabled={isSaving}
          />
          <CharCounter current={formData.location.length} max={TEXT_LIMITS.LABEL} />
          {locationLengthError && (
            <p className="mt-1 text-xs text-red-400">{locationLengthError}</p>
          )}
        </div>
        {/* Email 1 (Primary) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Primary Email <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              {formData.showEmail1 ? (
                <Eye className="h-4 w-4 text-green-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted" />
              )}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showEmail1: !formData.showEmail1 })}
                disabled={isReadOnly || isSaving}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.showEmail1 ? "bg-green-500" : "bg-gray-300"
                }`}
                role="switch"
                aria-checked={formData.showEmail1}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.showEmail1 ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <input
            type="email"
            value={formData.email1}
            onChange={(e) => {
              const trimmed = e.target.value.trim();
              setFormData({ ...formData, email1: e.target.value, email: e.target.value }); // Update legacy field too
              // Real-time validation
              const hasAnyPhone = phoneNumber.trim() || phoneNumber2.trim() || whatsappNumber.trim();
              if (!trimmed && !hasAnyPhone) {
                setEmail1Error("At least one contact method (email or phone) is required");
              } else if (trimmed) {
                const validation = validateEmail(trimmed);
                setEmail1Error(validation.error);
              } else {
                setEmail1Error(null);
              }
            }}
            onBlur={(e) => {
              const trimmed = e.target.value.trim();
              setFormData({ ...formData, email1: trimmed, email: trimmed });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              email1Error
                ? "border-red-500 bg-red-500/10 focus:ring-red-500 focus:border-red-500"
                : "border-border bg-background text-foreground focus:ring-accent focus:border-accent"
            }`}
            required
            disabled={isSaving || isReadOnly}
          />
          {email1Error && (
            <p className="mt-1 text-xs text-red-400">{email1Error}</p>
          )}
          {userDefaults && formData.email1 === userDefaults.email && !initialData?.email1?.trim() && (
            <p className="mt-1.5 text-xs text-muted flex items-center gap-1.5 animate-pulse">
              <Sparkles className="h-3 w-3 text-accent" />
              <span>Suggested from your account</span>
            </p>
          )}
        </div>
        
        {/* Email 2 (Secondary) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Secondary Email <span className="text-muted text-xs font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              {formData.showEmail2 ? (
                <Eye className="h-4 w-4 text-green-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted" />
              )}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showEmail2: !formData.showEmail2 })}
                disabled={isReadOnly || isSaving}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.showEmail2 ? "bg-green-500" : "bg-gray-300"
                }`}
                role="switch"
                aria-checked={formData.showEmail2}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.showEmail2 ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <input
            type="email"
            value={formData.email2}
            onChange={(e) => {
              setFormData({ ...formData, email2: e.target.value });
              if (e.target.value.trim()) {
                const validation = validateEmail(e.target.value.trim());
                setEmail2Error(validation.error);
              } else {
                setEmail2Error(null);
              }
            }}
            onBlur={(e) => {
              const trimmed = e.target.value.trim();
              setFormData({ ...formData, email2: trimmed });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              email2Error
                ? "border-red-500 bg-red-500/10 focus:ring-red-500 focus:border-red-500"
                : "border-border bg-background text-foreground focus:ring-accent focus:border-accent"
            }`}
            placeholder="Optional secondary email"
            disabled={isSaving || isReadOnly}
          />
          {email2Error && (
            <p className="mt-1 text-xs text-red-400">{email2Error}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">LinkedIn URL</label>
          <input
            type="url"
            value={formData.linkedIn}
            maxLength={TEXT_LIMITS.URL}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, linkedIn: value });
              setUploadError(null); // Clear error when user types
              const validation = validateTextLength(value, TEXT_LIMITS.URL, "LinkedIn URL");
              setLinkedInLengthError(validation.error);
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              linkedInLengthError
                ? "border-red-500 bg-red-500/10 focus:ring-red-500 focus:border-red-500"
                : "border-border bg-background text-foreground focus:ring-accent focus:border-accent"
            }`}
            placeholder="https://www.linkedin.com/in/..."
            required
            pattern="https?://.+"
            title="Please enter a valid URL starting with http:// or https://"
            disabled={isSaving}
          />
          <CharCounter current={formData.linkedIn.length} max={TEXT_LIMITS.URL} />
          {linkedInLengthError && (
            <p className="mt-1 text-xs text-red-400">{linkedInLengthError}</p>
          )}
        </div>
        {/* Phone 1 (Primary) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Primary Phone <span className="text-muted text-xs font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              {formData.showPhone1 ? (
                <Eye className="h-4 w-4 text-green-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted" />
              )}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showPhone1: !formData.showPhone1 })}
                disabled={isReadOnly || isSaving}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.showPhone1 ? "bg-green-500" : "bg-gray-300"
                }`}
                role="switch"
                aria-checked={formData.showPhone1}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.showPhone1 ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className={`flex border rounded-lg overflow-hidden transition-all h-[2.5rem] shadow-sm hover:border-border/80 ${
            phoneError
              ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500"
              : "border-border bg-background focus-within:ring-2 focus-within:ring-accent focus-within:border-accent"
          }`}>
            <select
              value={selectedCountry}
              onChange={(e) => {
                handleCountryChange(e.target.value);
                // Re-validate on country change
                const fullPhone = getFullPhoneNumber();
                if (fullPhone) {
                  const validation = validatePhoneUtil(fullPhone, e.target.value);
                  setPhoneError(validation.error);
                }
              }}
              disabled={isSaving || isReadOnly}
              className="phone-select px-4 py-2 border-r border-border bg-panel text-foreground text-sm font-medium cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] h-full appearance-none hover:bg-panel2 transition-colors flex-shrink-0"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code} className="bg-background text-foreground">
                  {country.flag} {country.name} {country.dialCode}
                </option>
              ))}
            </select>
            <div className="flex items-center px-2">
              <div className="h-5 w-px bg-border/60"></div>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => {
                handlePhoneNumberChange(e.target.value);
                // Real-time validation
                const fullPhone = getFullPhoneNumber();
                if (fullPhone) {
                  const validation = validatePhoneUtil(fullPhone, selectedCountry);
                  setPhoneError(validation.error);
                } else {
                  setPhoneError(null);
                }
                // Update email1 validation if phone is cleared (email1 becomes required)
                const hasAnyPhone = e.target.value.trim() || phoneNumber2.trim() || whatsappNumber.trim();
                const trimmedEmail1 = formData.email1?.trim() || "";
                if (!trimmedEmail1 && !hasAnyPhone) {
                  setEmail1Error("At least one contact method (email or phone) is required");
                } else if (trimmedEmail1 && email1Error === "At least one contact method (email or phone) is required") {
                  // Clear the "required" error if email1 exists
                  const validation = validateEmail(trimmedEmail1);
                  setEmail1Error(validation.error);
                }
              }}
              disabled={isSaving || isReadOnly}
              placeholder="Enter phone number"
              className="flex-1 px-4 py-2 border-none bg-transparent text-foreground focus:outline-none disabled:opacity-50 placeholder:text-muted/60 h-full"
            />
          </div>
          {phoneError && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
              <X className="h-3 w-3" />
              {phoneError}
            </p>
          )}
          <p className="mt-1 text-xs text-muted">Stored in international format (E.164)</p>
        </div>
        
        {/* Phone 2 (Secondary) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              Secondary Phone <span className="text-muted text-xs font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              {formData.showPhone2 ? (
                <Eye className="h-4 w-4 text-green-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted" />
              )}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showPhone2: !formData.showPhone2 })}
                disabled={isReadOnly || isSaving}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.showPhone2 ? "bg-green-500" : "bg-gray-300"
                }`}
                role="switch"
                aria-checked={formData.showPhone2}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.showPhone2 ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className={`flex border rounded-lg overflow-hidden transition-all h-[2.5rem] shadow-sm hover:border-border/80 ${
            phoneError2
              ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500"
              : "border-border bg-background focus-within:ring-2 focus-within:ring-accent focus-within:border-accent"
          }`}>
            <select
              value={selectedCountry2}
              onChange={(e) => {
                setSelectedCountry2(e.target.value);
                setPhoneError2(null);
                const fullPhone = getFullPhoneNumber2(phoneNumber2, e.target.value);
                if (fullPhone) {
                  const validation = validatePhoneUtil(fullPhone, e.target.value);
                  setPhoneError2(validation.error);
                }
              }}
              disabled={isSaving || isReadOnly}
              className="phone-select px-4 py-2 border-r border-border bg-panel text-foreground text-sm font-medium cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] h-full appearance-none hover:bg-panel2 transition-colors flex-shrink-0"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code} className="bg-background text-foreground">
                  {country.flag} {country.name} {country.dialCode}
                </option>
              ))}
            </select>
            <div className="flex items-center px-2">
              <div className="h-5 w-px bg-border/60"></div>
            </div>
            <input
              type="tel"
              value={phoneNumber2}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d\s\-()]/g, "");
                setPhoneNumber2(cleaned);
                setPhoneError2(null);
                const fullPhone = getFullPhoneNumber2(cleaned, selectedCountry2);
                if (fullPhone) {
                  const validation = validatePhoneUtil(fullPhone, selectedCountry2);
                  setPhoneError2(validation.error);
                }
                // Update email1 validation if phone is cleared (email1 becomes required)
                const hasAnyPhone = phoneNumber.trim() || cleaned.trim() || whatsappNumber.trim();
                const trimmedEmail1 = formData.email1?.trim() || "";
                if (!trimmedEmail1 && !hasAnyPhone) {
                  setEmail1Error("At least one contact method (email or phone) is required");
                } else if (trimmedEmail1 && email1Error === "At least one contact method (email or phone) is required") {
                  const validation = validateEmail(trimmedEmail1);
                  setEmail1Error(validation.error);
                }
              }}
              disabled={isSaving || isReadOnly}
              placeholder="Enter secondary phone number"
              className="flex-1 px-4 py-2 border-none bg-transparent text-foreground focus:outline-none disabled:opacity-50 placeholder:text-muted/60 h-full"
            />
          </div>
          {phoneError2 && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
              <X className="h-3 w-3" />
              {phoneError2}
            </p>
          )}
        </div>
        
        {/* WhatsApp */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              WhatsApp <span className="text-muted text-xs font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-2">
              {formData.showWhatsApp ? (
                <Eye className="h-4 w-4 text-green-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted" />
              )}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showWhatsApp: !formData.showWhatsApp })}
                disabled={isReadOnly || isSaving}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.showWhatsApp ? "bg-green-500" : "bg-gray-300"
                }`}
                role="switch"
                aria-checked={formData.showWhatsApp}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.showWhatsApp ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className={`flex border rounded-lg overflow-hidden transition-all h-[2.5rem] shadow-sm hover:border-border/80 ${
            whatsappError
              ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500"
              : "border-border bg-background focus-within:ring-2 focus-within:ring-accent focus-within:border-accent"
          }`}>
            <select
              value={selectedCountryWhatsApp}
              onChange={(e) => {
                setSelectedCountryWhatsApp(e.target.value);
                setWhatsappError(null);
                const fullPhone = getFullPhoneNumber2(whatsappNumber, e.target.value);
                if (fullPhone) {
                  const validation = validatePhoneUtil(fullPhone, e.target.value);
                  setWhatsappError(validation.error);
                }
              }}
              disabled={isSaving || isReadOnly}
              className="phone-select px-4 py-2 border-r border-border bg-panel text-foreground text-sm font-medium cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] h-full appearance-none hover:bg-panel2 transition-colors flex-shrink-0"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code} className="bg-background text-foreground">
                  {country.flag} {country.name} {country.dialCode}
                </option>
              ))}
            </select>
            <div className="flex items-center px-2">
              <div className="h-5 w-px bg-border/60"></div>
            </div>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d\s\-()]/g, "");
                setWhatsappNumber(cleaned);
                // Real-time validation with debouncing
                const timeoutId = setTimeout(() => {
                  const fullPhone = getFullPhoneNumber2(cleaned, selectedCountryWhatsApp);
                  if (fullPhone && fullPhone.length > 5) { // Only validate if phone has enough digits
                    const validation = validatePhoneUtil(fullPhone, selectedCountryWhatsApp);
                    setWhatsappError(validation.error);
                  } else if (!cleaned.trim()) {
                    setWhatsappError(null);
                  }
                  // Update email1 validation if phone is cleared (email1 becomes required)
                  const hasAnyPhone = phoneNumber.trim() || phoneNumber2.trim() || cleaned.trim();
                  const trimmedEmail1 = formData.email1?.trim() || "";
                  if (!trimmedEmail1 && !hasAnyPhone) {
                    setEmail1Error("At least one contact method (email or phone) is required");
                  } else if (trimmedEmail1 && email1Error === "At least one contact method (email or phone) is required") {
                    const validation = validateEmail(trimmedEmail1);
                    setEmail1Error(validation.error);
                  }
                }, 500); // Debounce validation by 500ms
                
                return () => clearTimeout(timeoutId);
              }}
              disabled={isSaving || isReadOnly}
              placeholder="Enter WhatsApp number"
              className="flex-1 px-4 py-2 border-none bg-transparent text-foreground focus:outline-none disabled:opacity-50 placeholder:text-muted/60 h-full"
            />
          </div>
          {whatsappError && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
              <X className="h-3 w-3" />
              {whatsappError}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Contact Message</label>
          <textarea
            value={formData.contactMessage || ""}
            maxLength={TEXT_LIMITS.CONTACT_MESSAGE}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({ ...formData, contactMessage: value });
              const validation = validateTextLength(value, TEXT_LIMITS.CONTACT_MESSAGE, "Contact message");
              setContactMessageLengthError(validation.error);
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              contactMessageLengthError
                ? "border-red-500 bg-red-500/10 focus:ring-red-500 focus:border-red-500"
                : "border-border bg-background text-foreground focus:ring-accent focus:border-accent"
            }`}
            rows={3}
            disabled={isSaving}
          />
          <CharCounter current={(formData.contactMessage || "").length} max={TEXT_LIMITS.CONTACT_MESSAGE} />
          {contactMessageLengthError && (
            <p className="mt-1 text-xs text-red-400">{contactMessageLengthError}</p>
          )}
          <p className="mt-1 text-xs text-muted">Edit or replace the default contact message.</p>
          <p className="mt-1 text-xs text-muted">Optional. If left empty, a generic message will be shown.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">CV/Resume PDF</label>
          <div className="space-y-2">
            {formData.cvUrl && uploadedFileName ? (
              <div className="border border-border bg-panel2 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{uploadedFileName}</p>
                      <a
                        href={formData.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:text-blue-400 transition-colors"
                      >
                        View PDF
                      </a>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded-lg hover:bg-panel2 cursor-pointer transition-colors disabled:opacity-50">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Replace
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading || isSaving}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <>
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border bg-panel2 text-foreground rounded-lg hover:bg-panel cursor-pointer transition-colors disabled:opacity-50">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Click to upload CV/Resume PDF</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading || isSaving}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={
              isSaving || 
              !!phoneError || 
              !!phoneError2 || 
              !!whatsappError || 
              !!email1Error || 
              !!email2Error ||
              !!nameLengthError ||
              !!roleLengthError ||
              !!locationLengthError ||
              !!linkedInLengthError ||
              !!contactMessageLengthError ||
              (!formData.email1?.trim() && !phoneNumber.trim() && !phoneNumber2.trim() && !whatsappNumber.trim()) // At least one contact method required
            }
            className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setIsCreating(false);
              setUploadError(null);
              setPhoneError(null);
              if (personInfo) {
                setFormData({
                  name: personInfo.name || "",
                  email: personInfo.email || "",
                  role: personInfo.role || "",
                  location: personInfo.location || "",
                  linkedIn: personInfo.linkedIn || "",
                  phone: personInfo.phone || "",
                  contactMessage: personInfo.contactMessage || "",
                  cvUrl: personInfo.cvUrl || "",
                });
                // Reset phone state
                const phoneState = initializePhoneState(personInfo.phone);
                setSelectedCountry(phoneState.country);
                setPhoneNumber(phoneState.number);
              }
            }}
            disabled={isSaving}
            className="px-4 py-2 border border-border bg-panel2 text-foreground rounded-lg hover:bg-panel transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
