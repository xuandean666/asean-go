import { Injectable, Logger } from '@nestjs/common';
import type {
  DocumentFields,
  DocumentRecord,
  PaginationParams,
  PaginationResult,
} from '@shared/api.interface';

type DocType = 'invoice' | 'packing_list' | 'bill_of_lading' | 'certificate_of_origin';

const DOC_TYPE_LABELS: Record<DocType, string> = {
  invoice: '商业发票',
  packing_list: '装箱单',
  bill_of_lading: '海运提单',
  certificate_of_origin: '原产地证',
};

function randomId(): string {
  return 'doc_' + Math.random().toString(36).substring(2, 14);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function genFields(docType: string, seed: number): DocumentFields {
  const rng = (offset: number): number => seededRandom(seed + offset);
  const baseHS = '8517.12' + Math.floor(rng(1) * 90 + 10);
  const quantities = [100, 250, 500, 1000, 2000];
  const qtyIdx = Math.floor(rng(2) * quantities.length);
  const quantity = quantities[qtyIdx];
  const unitPrice = 12.5 + rng(3) * 50;
  const totalAmount = Math.round(quantity * unitPrice * 100) / 100;
  const grossWeight = Math.round(quantity * 0.35 * 10) / 10;
  const netWeight = Math.round(quantity * 0.3 * 10) / 10;

  const common: DocumentFields = {
    productName: '无线蓝牙耳机 Wireless Bluetooth Earbuds',
    hsCode: baseHS,
    quantity,
    unitPrice: Math.round(unitPrice * 100) / 100,
    totalAmount,
    grossWeight,
    netWeight,
    currency: 'USD',
    originCountry: 'China',
    destinationCountry: ['Vietnam', 'Thailand', 'Indonesia', 'Malaysia', 'Philippines'][Math.floor(rng(4) * 5)],
    shipper: 'Shenzhen Tech Trading Co., Ltd.\n深圳市南山区科技园南区 8 栋 5 楼',
    consignee: 'ASEAN Electronics Import/Export Co., Ltd.\nNo. 123, Business District, Ho Chi Minh City',
  };

  if (docType === 'invoice') {
    return {
      ...common,
      invoiceNo: `INV-${2025}${String(Math.floor(rng(5) * 9000 + 1000)).padStart(4, '0')}`,
    };
  }
  if (docType === 'bill_of_lading') {
    return {
      ...common,
      blNo: `BL${Math.floor(rng(6) * 900000 + 100000)}`,
      containerNo: `MSKU${Math.floor(rng(7) * 9000000 + 1000000)}`,
    };
  }
  if (docType === 'packing_list') {
    return {
      ...common,
      invoiceNo: `INV-${2025}${String(Math.floor(rng(8) * 9000 + 1000)).padStart(4, '0')}`,
    };
  }
  if (docType === 'certificate_of_origin') {
    return {
      ...common,
      invoiceNo: `INV-${2025}${String(Math.floor(rng(9) * 9000 + 1000)).padStart(4, '0')}`,
    };
  }
  return common;
}

function genConfidence(docType: string, seed: number): number {
  // Simulate OCR confidence. Some fields may have lower confidence.
  const base = 0.92 + seededRandom(seed + 100) * 0.07;
  return Math.round(base * 100) / 100;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private records: DocumentRecord[];

  constructor() {
    this.records = this.seedMockData();
  }

  private seedMockData(): DocumentRecord[] {
    const seeds: { fileName: string; docType: DocType }[] = [
      { fileName: 'INV-20250815-越南订单.pdf', docType: 'invoice' },
      { fileName: '装箱单-电子类目-0815.pdf', docType: 'packing_list' },
      { fileName: 'BOL-SHIP0815-HCM.pdf', docType: 'bill_of_lading' },
      { fileName: '原产地证-Form E-ASEAN.pdf', docType: 'certificate_of_origin' },
      { fileName: 'INV-20250812-泰国订单.pdf', docType: 'invoice' },
      { fileName: '装箱单-服装类目-0812.pdf', docType: 'packing_list' },
      { fileName: 'BOL-SHIP0812-BKK.pdf', docType: 'bill_of_lading' },
      { fileName: '原产地证-Form D-泰国.pdf', docType: 'certificate_of_origin' },
    ];

    const now = Date.now();
    return seeds.map((s, i: number) => {
      const seed = i * 17 + 42;
      const extractedFields = genFields(s.docType, seed);
      const confidence = genConfidence(s.docType, seed);
      const createdAt = new Date(now - i * 43200000 - Math.random() * 7200000);
      return {
        id: randomId(),
        fileName: s.fileName,
        docType: s.docType,
        extractedFields,
        confidence,
        status: i < 6 ? 'completed' : 'processing',
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
      };
    });
  }

  async getDocuments(
    params: PaginationParams & { docType?: string; status?: string },
  ): Promise<PaginationResult<DocumentRecord>> {
    const { page, pageSize, docType, status } = params;
    let filtered = [...this.records];
    if (docType) {
      filtered = filtered.filter((r: DocumentRecord) => r.docType === docType);
    }
    if (status) {
      filtered = filtered.filter((r: DocumentRecord) => r.status === status);
    }
    filtered.sort((a: DocumentRecord, b: DocumentRecord) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return { items, total, page, pageSize };
  }

  async getDocument(id: string): Promise<DocumentRecord | null> {
    return this.records.find((r: DocumentRecord) => r.id === id) ?? null;
  }

  async uploadDocument(data: {
    fileName: string;
    docType: string;
    projectId?: string;
  }): Promise<DocumentRecord> {
    const { fileName, docType, projectId } = data;
    const seed = Math.floor(Math.random() * 100000);
    const extractedFields = genFields(docType, seed);
    const confidence = genConfidence(docType, seed);
    const now = new Date().toISOString();
    const record: DocumentRecord = {
      id: randomId(),
      fileName,
      docType,
      projectId,
      extractedFields,
      confidence,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    };
    this.records.unshift(record);
    this.logger.log(`Uploaded document: ${record.id} - ${fileName}`);
    return record;
  }

  async crossCheck(docIds: string[]): Promise<{
    docs: DocumentRecord[];
    hasDiscrepancies: boolean;
    discrepancies: {
      field: string;
      fieldLabel: string;
      values: { docId: string; fileName: string; value: string }[];
      severity: string;
    }[];
  }> {
    const docs = docIds
      .map((id: string) => this.records.find((r: DocumentRecord) => r.id === id))
      .filter((d): d is DocumentRecord => !!d);

    if (docs.length < 2) {
      return { docs, hasDiscrepancies: false, discrepancies: [] };
    }

    const fieldLabels: Record<string, string> = {
      productName: '品名',
      hsCode: 'HS 编码',
      quantity: '数量',
      totalAmount: '总金额',
      grossWeight: '毛重',
      netWeight: '净重',
      originCountry: '原产国',
      destinationCountry: '目的国',
      shipper: '发货人',
      consignee: '收货人',
    };

    const compareFields = [
      'productName',
      'hsCode',
      'quantity',
      'totalAmount',
      'grossWeight',
      'netWeight',
      'originCountry',
      'destinationCountry',
    ];

    const discrepancies: {
      field: string;
      fieldLabel: string;
      values: { docId: string; fileName: string; value: string }[];
      severity: string;
    }[] = [];

    for (const field of compareFields) {
      const values = docs.map((d: DocumentRecord) => {
        const val = d.extractedFields?.[field as keyof DocumentFields];
        return {
          docId: d.id,
          fileName: d.fileName,
          value: val !== undefined && val !== null ? String(val) : '-',
        };
      });
      const uniqueVals = new Set(values.map((v) => v.value));
      if (uniqueVals.size > 1) {
        const severity =
          field === 'hsCode' || field === 'totalAmount' ? 'high' : 'medium';
        discrepancies.push({
          field,
          fieldLabel: fieldLabels[field] || field,
          values,
          severity,
        });
      }
    }

    return {
      docs,
      hasDiscrepancies: discrepancies.length > 0,
      discrepancies,
    };
  }

  async updateDocument(
    id: string,
    patch: { extractedFields: Partial<DocumentFields> },
  ): Promise<DocumentRecord | null> {
    const record = this.records.find((r: DocumentRecord) => r.id === id);
    if (!record) return null;
    record.extractedFields = {
      ...record.extractedFields,
      ...patch.extractedFields,
    };
    record.updatedAt = new Date().toISOString();
    if (record.confidence !== undefined) {
      record.confidence = Math.min(1, record.confidence + 0.01);
    }
    this.logger.log(`Updated document fields: ${id}`);
    return record;
  }

  getDocTypeLabel(docType: string): string {
    return DOC_TYPE_LABELS[docType as DocType] || docType;
  }
}
