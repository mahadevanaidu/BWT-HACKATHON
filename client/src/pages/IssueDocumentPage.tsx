import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { documentService } from '@/lib/services';
import { queryKeys } from '@/lib/queryKeys';
import { getApiError } from '@/lib/api';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '@/lib/utils';
import type { CreateDocumentPayload, DocumentType } from '@/types';

export default function IssueDocumentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateDocumentPayload & { tagsInput?: string }>();

  const mutation = useMutation({
    mutationFn: (payload: CreateDocumentPayload) => documentService.create(payload),
    onSuccess: (doc) => {
      toast('success', 'Document issued', `Verification ID: ${doc.verificationId}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard() });
      navigate(`/documents/${doc._id}`);
    },
    onError: (err) => toast('error', 'Failed to issue document', getApiError(err)),
  });

  function onSubmit(data: CreateDocumentPayload & { tagsInput?: string }) {
    const { tagsInput, ...rest } = data;
    const payload: CreateDocumentPayload = {
      ...rest,
      tags: tagsInput
        ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
    };
    mutation.mutate(payload);
  }

  const typeOptions = DOCUMENT_TYPES.map((t) => ({
    value: t,
    label: DOCUMENT_TYPE_LABELS[t],
  }));

  return (
    <div className="page-container py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-7">
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-1.5 text-sm text-warm-muted hover:text-warm-white transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Registry
        </button>
        <motion.h1
          className="text-2xl font-semibold text-warm-white tracking-tight"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Issue Document
        </motion.h1>
        <p className="text-sm text-warm-muted mt-1">
          A unique verification ID and QR code will be generated automatically.
        </p>
      </div>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Document info */}
        <div className="verity-card p-6 mb-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-emerald" />
            </div>
            <h2 className="text-sm font-semibold text-warm-white">Document Information</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Document Title *"
                placeholder="e.g. Bachelor of Science in Computer Science"
                error={errors.title?.message}
                {...register('title', { required: 'Title is required' })}
              />
            </div>

            <Select
              label="Document Type *"
              options={typeOptions}
              placeholder="Select a type…"
              error={errors.documentType?.message}
              {...register('documentType', { required: 'Document type is required' })}
            />

            <Input
              label="Issue Date *"
              type="date"
              error={errors.issueDate?.message}
              max={new Date().toISOString().split('T')[0]}
              {...register('issueDate', { required: 'Issue date is required' })}
            />

            <Input
              label="Expiration Date"
              type="date"
              hint="Leave empty for non-expiring documents"
              error={errors.expirationDate?.message}
              min={watch('issueDate')}
              {...register('expirationDate')}
            />
          </div>
        </div>

        {/* Holder info */}
        <div className="verity-card p-6 mb-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
            </div>
            <h2 className="text-sm font-semibold text-warm-white">Holder & Issuer</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Holder Name *"
              placeholder="Full legal name"
              error={errors.holderName?.message}
              {...register('holderName', { required: 'Holder name is required' })}
            />

            <Input
              label="Holder Email"
              type="email"
              placeholder="holder@example.com"
              error={errors.holderEmail?.message}
              {...register('holderEmail', {
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Enter a valid email',
                },
              })}
            />

            <Input
              label="Issuing Institution *"
              placeholder="e.g. Meridian Technology University"
              error={errors.issuingInstitution?.message}
              {...register('issuingInstitution', { required: 'Issuing institution is required' })}
            />

            <Input
              label="Department / Division"
              placeholder="e.g. Faculty of Engineering"
              {...register('issuerDepartment')}
            />
          </div>
        </div>

        {/* Optional metadata */}
        <div className="verity-card p-6 mb-6">
          <h2 className="text-sm font-semibold text-warm-white mb-4">Additional Details</h2>

          <div className="space-y-4">
            <Textarea
              label="Description"
              placeholder="Optional notes about this document…"
              rows={3}
              error={errors.description?.message}
              {...register('description', { maxLength: { value: 1000, message: 'Max 1000 characters' } })}
            />

            <Input
              label="Tags"
              placeholder="e.g. engineering, honours, 2024"
              hint="Comma-separated tags for easy filtering"
              {...register('tagsInput' as keyof CreateDocumentPayload)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/documents')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={mutation.isPending}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Issue & Generate QR Code
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
