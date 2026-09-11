import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cases')
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo caso' })
  create(@CurrentUser() user: any, @Body() dto: CreateCaseDto) {
    return this.casesService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis casos' })
  findAll(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('legalArea') legalArea?: string,
    @Query('processType') processType?: string,
    @Query('responsibleLawyer') responsibleLawyer?: string,
  ) {
    return this.casesService.findAll(user.sub, pagination, { status, legalArea, processType, responsibleLawyer });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un caso' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.findOne(user.sub, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar caso' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.casesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar caso' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.remove(user.sub, id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Resumen del caso' })
  getSummary(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getSummary(user.sub, id);
  }

  @Post(':id/facts')
  @ApiOperation({ summary: 'Agregar hecho' })
  addFact(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addFact(user.sub, id, body);
  }

  @Get(':id/facts')
  @ApiOperation({ summary: 'Obtener hechos' })
  getFacts(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getFacts(user.sub, id);
  }

  @Put(':id/facts/:factId')
  @ApiOperation({ summary: 'Actualizar hecho' })
  updateFact(@CurrentUser() user: any, @Param('id') id: string, @Param('factId') factId: string, @Body() body: any) {
    return this.casesService.updateFact(user.sub, id, factId, body);
  }

  @Delete(':id/facts/:factId')
  @ApiOperation({ summary: 'Eliminar hecho' })
  deleteFact(@CurrentUser() user: any, @Param('id') id: string, @Param('factId') factId: string) {
    return this.casesService.deleteFact(user.sub, id, factId);
  }

  @Post(':id/timeline')
  @ApiOperation({ summary: 'Agregar evento' })
  addEvent(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addEvent(user.sub, id, body);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Obtener linea de tiempo' })
  getTimeline(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getTimeline(user.sub, id);
  }

  @Put(':id/timeline/:eventId')
  @ApiOperation({ summary: 'Actualizar evento' })
  updateEvent(@CurrentUser() user: any, @Param('id') id: string, @Param('eventId') eventId: string, @Body() body: any) {
    return this.casesService.updateEvent(user.sub, id, eventId, body);
  }

  @Delete(':id/timeline/:eventId')
  @ApiOperation({ summary: 'Eliminar evento' })
  deleteEvent(@CurrentUser() user: any, @Param('id') id: string, @Param('eventId') eventId: string) {
    return this.casesService.deleteEvent(user.sub, id, eventId);
  }

  @Post(':id/persons')
  @ApiOperation({ summary: 'Agregar persona' })
  addPerson(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addPerson(user.sub, id, body);
  }

  @Get(':id/persons')
  @ApiOperation({ summary: 'Obtener personas' })
  getPersons(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getPersons(user.sub, id);
  }

  @Put(':id/persons/:personId')
  @ApiOperation({ summary: 'Actualizar persona' })
  updatePerson(@CurrentUser() user: any, @Param('id') id: string, @Param('personId') personId: string, @Body() body: any) {
    return this.casesService.updatePerson(user.sub, id, personId, body);
  }

  @Delete(':id/persons/:personId')
  @ApiOperation({ summary: 'Eliminar persona' })
  deletePerson(@CurrentUser() user: any, @Param('id') id: string, @Param('personId') personId: string) {
    return this.casesService.deletePerson(user.sub, id, personId);
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Agregar prueba' })
  addEvidence(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addEvidence(user.sub, id, body);
  }

  @Get(':id/evidence')
  @ApiOperation({ summary: 'Obtener pruebas' })
  getEvidence(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getEvidence(user.sub, id);
  }

  @Put(':id/evidence/:evidenceId')
  @ApiOperation({ summary: 'Actualizar prueba' })
  updateEvidence(@CurrentUser() user: any, @Param('id') id: string, @Param('evidenceId') evidenceId: string, @Body() body: any) {
    return this.casesService.updateEvidence(user.sub, id, evidenceId, body);
  }

  @Delete(':id/evidence/:evidenceId')
  @ApiOperation({ summary: 'Eliminar prueba' })
  deleteEvidence(@CurrentUser() user: any, @Param('id') id: string, @Param('evidenceId') evidenceId: string) {
    return this.casesService.deleteEvidence(user.sub, id, evidenceId);
  }

  @Post(':id/legal-issues')
  @ApiOperation({ summary: 'Agregar problema juridico' })
  addLegalIssue(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addLegalIssue(user.sub, id, body);
  }

  @Get(':id/legal-issues')
  @ApiOperation({ summary: 'Obtener problemas juridicos' })
  getLegalIssues(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getLegalIssues(user.sub, id);
  }

  @Put(':id/legal-issues/:issueId')
  @ApiOperation({ summary: 'Actualizar problema juridico' })
  updateLegalIssue(@CurrentUser() user: any, @Param('id') id: string, @Param('issueId') issueId: string, @Body() body: any) {
    return this.casesService.updateLegalIssue(user.sub, id, issueId, body);
  }

  @Delete(':id/legal-issues/:issueId')
  @ApiOperation({ summary: 'Eliminar problema juridico' })
  deleteLegalIssue(@CurrentUser() user: any, @Param('id') id: string, @Param('issueId') issueId: string) {
    return this.casesService.deleteLegalIssue(user.sub, id, issueId);
  }

  @Post(':id/hearings')
  @ApiOperation({ summary: 'Agregar audiencia' })
  addHearing(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addHearing(user.sub, id, body);
  }

  @Get(':id/hearings')
  @ApiOperation({ summary: 'Obtener audiencias' })
  getHearings(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getHearings(user.sub, id);
  }

  @Put(':id/hearings/:hearingId')
  @ApiOperation({ summary: 'Actualizar audiencia' })
  updateHearing(@CurrentUser() user: any, @Param('id') id: string, @Param('hearingId') hearingId: string, @Body() body: any) {
    return this.casesService.updateHearing(user.sub, id, hearingId, body);
  }

  @Delete(':id/hearings/:hearingId')
  @ApiOperation({ summary: 'Eliminar audiencia' })
  deleteHearing(@CurrentUser() user: any, @Param('id') id: string, @Param('hearingId') hearingId: string) {
    return this.casesService.deleteHearing(user.sub, id, hearingId);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Agregar tarea' })
  addTask(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addTask(user.sub, id, body);
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Obtener tareas' })
  getTasks(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getTasks(user.sub, id);
  }

  @Put(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Actualizar tarea' })
  updateTask(@CurrentUser() user: any, @Param('id') id: string, @Param('taskId') taskId: string, @Body() body: any) {
    return this.casesService.updateTask(user.sub, id, taskId, body);
  }

  @Delete(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Eliminar tarea' })
  deleteTask(@CurrentUser() user: any, @Param('id') id: string, @Param('taskId') taskId: string) {
    return this.casesService.deleteTask(user.sub, id, taskId);
  }

  @Post(':id/alerts')
  @ApiOperation({ summary: 'Agregar alerta' })
  addAlert(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addAlert(user.sub, id, body);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Obtener alertas' })
  getAlerts(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getAlerts(user.sub, id);
  }

  @Put(':id/alerts/:alertId')
  @ApiOperation({ summary: 'Actualizar alerta' })
  updateAlert(@CurrentUser() user: any, @Param('id') id: string, @Param('alertId') alertId: string, @Body() body: any) {
    return this.casesService.updateAlert(user.sub, id, alertId, body);
  }

  @Post(':id/norms')
  @ApiOperation({ summary: 'Agregar norma' })
  addNorm(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.addNorm(user.sub, id, body);
  }

  @Get(':id/norms')
  @ApiOperation({ summary: 'Obtener normas' })
  getNorms(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getNorms(user.sub, id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Obtener documentos del caso' })
  getDocuments(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getDocuments(user.sub, id);
  }

  @Get(':id/generated-documents')
  @ApiOperation({ summary: 'Obtener documentos generados' })
  getGeneratedDocuments(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getGeneratedDocuments(user.sub, id);
  }

  @Post(':id/jurisprudence')
  @ApiOperation({ summary: 'Guardar jurisprudencia relacionada' })
  saveJurisprudence(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.casesService.saveJurisprudence(user.sub, id, body);
  }

  @Get(':id/jurisprudence')
  @ApiOperation({ summary: 'Obtener jurisprudencia del caso' })
  getJurisprudence(@CurrentUser() user: any, @Param('id') id: string) {
    return this.casesService.getJurisprudence(user.sub, id);
  }
}
