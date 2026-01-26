"use client";

import { useState } from "react";
import { Save, Upload, Loader2, Plus, Sparkles, Edit2, X, FileText, Phone, Mail, MapPin, Briefcase, Link as LinkIcon } from "lucide-react";
import { updatePersonInfo, type getPersonInfo } from "@/app/actions/contact";
import { uploadCV } from "@/app/actions/upload";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { COUNTRIES, getCountryByCode, getCountryByDialCode } from "@/lib/countries";
import { DEFAULT_SECTION_INTROS } from "@/lib/section-intros";

type PersonInfo = Awaited<ReturnType<typeof getPersonInfo>>;

type UserDefaults = {
  name: string;
  email: string;
} | null;

export function ContactManager({ 
  initialData, 
  userDefaults,
  isReadOnly = false 
}: { 
  initialData: PersonInfo | null; 
  userDefaults?: UserDefaults;
  isReadOnly?: boolean;
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
    return {
      name: existingName || userDefaults?.name || "",
      email: existingEmail || userDefaults?.email || "",
      role: initialData?.role || "",
      location: initialData?.location || "",
      linkedIn: initialData?.linkedIn || "",
      phone: initialData?.phone || "",
      contactMessage: initialData?.contactMessage || DEFAULT_SECTION_INTROS.contact,
      cvUrl: initialData?.cvUrl || "",
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

  // Phone input state
  const initialPhoneState = initializePhoneState(initialData?.phone);
  const [selectedCountry, setSelectedCountry] = useState<string>(initialPhoneState.country);
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneState.number);

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
    setPhoneError(null);
  };

  // Build full phone number with country code
  const getFullPhoneNumber = (): string => {
    if (!phoneNumber.trim()) return "";
    const country = getCountryByCode(selectedCountry);
    return `${country.dialCode}${phoneNumber.replace(/\s/g, "")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setPhoneError(null);
    
    // Validate LinkedIn URL format
    if (formData.linkedIn && !formData.linkedIn.match(/^https?:\/\/.+/)) {
      setUploadError("LinkedIn URL must start with http:// or https://");
      return;
    }
    
    // Build and validate phone number
    const fullPhone = getFullPhoneNumber();
    const phoneValidationError = validatePhone(fullPhone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }
    
    // Normalize phone to E.164 format before saving
    let normalizedPhone: string | null = null;
    if (fullPhone) {
      try {
        const parsed = parsePhoneNumber(fullPhone);
        normalizedPhone = parsed.number; // E.164 format
      } catch {
        // If parsing fails but validation passed, use as-is (shouldn't happen)
        normalizedPhone = fullPhone;
      }
    }
    
    setIsSaving(true);
    try {
      const result = await updatePersonInfo({
        name: formData.name,
        role: formData.role,
        location: formData.location,
        email: formData.email,
        linkedIn: formData.linkedIn,
        phone: normalizedPhone,
        contactMessage: formData.contactMessage,
        cvUrl: formData.cvUrl,
      });
      setPersonInfo(result);
      setIsEditing(false);
      setIsCreating(false);
      setUploadError(null);
      setPhoneError(null);
      // Update form data with saved values to ensure consistency
      setFormData({
        name: result.name,
        email: result.email,
        role: result.role,
        location: result.location,
        linkedIn: result.linkedIn,
        phone: result.phone || "",
        contactMessage: result.contactMessage || "",
        cvUrl: result.cvUrl || "",
      });
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
      const updatedPersonInfo = await updatePersonInfo(updatedFormData);
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
              setFormData({
                name: personInfo?.name?.trim() || "",
                email: personInfo?.email?.trim() || "",
                role: personInfo?.role || "",
                location: personInfo?.location || "",
                linkedIn: personInfo?.linkedIn || "",
                phone: personInfo?.phone || "",
                contactMessage: personInfo?.contactMessage || "",
                cvUrl: personInfo?.cvUrl || "",
              });
              // Initialize phone state
              const phoneState = initializePhoneState(personInfo?.phone);
              setSelectedCountry(phoneState.country);
              setPhoneNumber(phoneState.number);
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

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">Email</p>
              <p className="text-sm font-medium text-foreground">{personInfo.email || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted mb-1">Phone Number</p>
              <p className="text-sm font-medium text-foreground">{formatPhoneForDisplay(personInfo.phone)}</p>
            </div>
          </div>

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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            required
            disabled={isSaving}
          />
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
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            required
            disabled={isSaving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            required
            disabled={isSaving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            required
            disabled={isSaving}
          />
          {userDefaults && formData.email === userDefaults.email && !initialData?.email?.trim() && (
            <p className="mt-1.5 text-xs text-muted flex items-center gap-1.5 animate-pulse">
              <Sparkles className="h-3 w-3 text-accent" />
              <span>Suggested from your account</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">LinkedIn URL</label>
          <input
            type="url"
            value={formData.linkedIn}
            onChange={(e) => {
              setFormData({ ...formData, linkedIn: e.target.value });
              setUploadError(null); // Clear error when user types
            }}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            placeholder="https://www.linkedin.com/in/..."
            required
            pattern="https?://.+"
            title="Please enter a valid URL starting with http:// or https://"
            disabled={isSaving}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Phone Number <span className="text-muted text-xs font-normal">(optional)</span>
          </label>
          <div className="flex border border-border bg-background rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-all h-[2.5rem] shadow-sm hover:border-border/80">
            <select
              value={selectedCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              disabled={isSaving}
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
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              disabled={isSaving}
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
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Contact Message</label>
          <textarea
            value={formData.contactMessage || ""}
            onChange={(e) => setFormData({ ...formData, contactMessage: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            rows={3}
            disabled={isSaving}
          />
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
            disabled={isSaving || !!phoneError}
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
