package pl.edu.pw.ia.threads.application

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import java.util.UUID
import org.axonframework.extensions.reactor.commandhandling.gateway.ReactorCommandGateway
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ServerWebExchange
import pl.edu.pw.ia.shared.application.exception.ApiErrorResponse
import pl.edu.pw.ia.shared.application.model.IdResponse
import pl.edu.pw.ia.shared.security.Scopes
import pl.edu.pw.ia.shared.security.getAccountId
import pl.edu.pw.ia.threads.application.model.BanUserRequest
import pl.edu.pw.ia.threads.application.model.UnbanUserRequest
import reactor.core.publisher.Mono

@Tag(name = "BannedUsers")
@ApiResponse(
	responseCode = "500",
	description = "Internal Server Error",
	content = [Content(schema = Schema(implementation = ApiErrorResponse::class))]
)
@SecurityRequirement(name = "Bearer")
interface BannedUserController {

	@Operation(description = "Ban user in thread")
	@ApiResponse(responseCode = "201", description = "Ok.")
	fun banUser(
		request: BanUserRequest,
		webExchange: ServerWebExchange
	): Mono<IdResponse>

	@Operation(description = "Unban user in thread")
	@ApiResponse(responseCode = "200", description = "Ok.")
	fun unBanUser(
		request: UnbanUserRequest,
		webExchange: ServerWebExchange
	): Mono<IdResponse>
}

@Validated
@RestController
@RequestMapping(
	value = ["/api/v1/bannedUsers"],
	produces = [MediaType.APPLICATION_JSON_VALUE]
)
class BannedUserControllerImpl(
	private val reactorCommandGateway: ReactorCommandGateway
) : BannedUserController {

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyAuthority('${Scopes.BANNEDUSER.WRITE}')")
	override fun banUser(
		@RequestBody request: BanUserRequest,
		webExchange: ServerWebExchange
	): Mono<IdResponse> {
		val command = request.toCommand(webExchange.getAccountId())
		// keycloakService.assignRoleToUser(command.subjectAccountId.toString(), "THREAD_BAN:${command.threadId}")
		// ^ this can be later checked as @PreAuthorize("!hasAnyAuthority('${THREAD_BAN:${request.threadId}}')")
		return reactorCommandGateway.send<UUID>(command).map { IdResponse(id = it) }
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.OK)
	@PreAuthorize("hasAnyAuthority('${Scopes.BANNEDUSER.WRITE}')")
	override fun unBanUser(
		@RequestBody request: UnbanUserRequest,
		webExchange: ServerWebExchange
	): Mono<IdResponse> {
		val command = request.toCommand(webExchange.getAccountId())
		return reactorCommandGateway.send<UUID>(command)
			.defaultIfEmpty(command.bannedUserId)
			.map { IdResponse(id = it) }
	}
}
